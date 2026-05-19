CREATE OR REPLACE FUNCTION public.get_purchase_orders_with_details(in_page integer, in_rows_per_page integer, in_filter_field text, in_filter_data text, in_sort_field text, in_sort_order integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
  v_po_ids bigint[];
  v_total_count bigint;
  v_result jsonb;
begin
  select total_count, po_ids
  into v_total_count, v_po_ids
  from public._get_purchase_order_ids_helper(
    in_page,
    in_rows_per_page,
    in_filter_field,
    in_filter_data,
    in_sort_field,
    in_sort_order
  );

  if v_po_ids is null or array_length(v_po_ids, 1) = 0 then
    v_result := jsonb_build_object(
      'total_count', coalesce(v_total_count, 0),
      'page', in_page,
      'rows_per_page', in_rows_per_page,
      'purchase_orders', jsonb '[]',
      'all_boxes', jsonb '[]',
      'all_po_recipes', jsonb '[]',
      'all_recipes', jsonb '[]',
      'all_recipe_elements', jsonb '[]',
      'all_products', jsonb '[]',
      'all_po_raw_lines', jsonb '[]',
      'all_invoices', jsonb '[]',
      'all_boxes_ids', jsonb '[]',
      'all_po_recipes_ids', jsonb '[]',
      'all_products_ids', jsonb '[]',
      'all_po_raw_lines_ids', jsonb '[]',
      'all_invoices_ids', jsonb '[]',
      'purchase_order_ids', jsonb '[]'
    );
    return v_result;
  end if;

  with selected_pos as (
    select po.*
    from purchase_orders po
    where po.purchase_order_id = any(v_po_ids)
    order by array_position(v_po_ids, po.purchase_order_id)
  ),

  po_cases as (
    select
      c.*,
      p.product_id as product_product_id,
      p.name as product_name,
      p.fnsku as product_fnsku,
      p.asin as product_asin,
      p.item_num as product_item_num,
      p.upc as product_upc
    from cases c
    left join products p on c.product_id = p.product_id
    where c.purchase_order_id = any(v_po_ids)
  ),

  individual_boxes_agg as (
    select
      c.purchase_order_id,
      jsonb_agg(
        jsonb_build_object(
          'case_id', c.case_id,
          'units_per_case', c.units_per_case,
          'date_received', c.date_received,
          'notes', c.notes,
          'product_id', c.product_id,
          'product_name', c.product_name,
          'location_id', c.location_id,
          'status', c.status,
          'purchase_order_id', c.purchase_order_id,
          'request_id', c.request_id,
          'item_num', c.product_item_num,
          'upc', c.product_upc
        ) order by c.case_id
      ) as individual_boxes_json
    from po_cases c
    where coalesce(nullif(c.product_fnsku, ''), nullif(c.product_asin, '')) is null
    group by c.purchase_order_id
  ),

  grouped_boxes as (
    select
      pb.purchase_order_id,
      jsonb_agg(
        jsonb_build_object(
          'product_id', pb.product_product_id,
          'product_name', pb.product_name,
          'fnsku', pb.product_fnsku,
          'asin', pb.product_asin,
          'item_num', pb.product_item_num,
          'upc', pb.product_upc,
          'amount', pb.cnt,
          'total_units', pb.total_units
        ) order by pb.product_product_id
      ) as grouped_boxes_json
    from (
      select
        purchase_order_id,
        product_product_id,
        product_name,
        product_fnsku,
        product_asin,
        product_item_num,
        product_upc,
        count(*) as cnt,
        coalesce(sum(units_per_case), 0) as total_units
      from po_cases
      where coalesce(nullif(product_fnsku, ''), nullif(product_asin, '')) is null
      group by purchase_order_id, product_product_id, product_name, product_fnsku, product_asin, product_item_num, product_upc
    ) pb
    group by pb.purchase_order_id
  ),

  grouped_cases as (
    select
      pc.purchase_order_id,
      jsonb_agg(
        jsonb_build_object(
          'product_id', pc.product_product_id,
          'product_name', pc.product_name,
          'fnsku', pc.product_fnsku,
          'asin', pc.product_asin,
          'item_num', pc.product_item_num,
          'upc', pc.product_upc,
          'amount', pc.cnt,
          'total_units', pc.total_units
        ) order by pc.product_product_id
      ) as grouped_cases_json
    from (
      select
        purchase_order_id,
        product_product_id,
        product_name,
        product_fnsku,
        product_asin,
        product_item_num,
        product_upc,
        count(*) as cnt,
        coalesce(sum(units_per_case), 0) as total_units
      from po_cases
      where coalesce(nullif(product_fnsku, ''), nullif(product_asin, '')) is not null
      group by purchase_order_id, product_product_id, product_name, product_fnsku, product_asin, product_item_num, product_upc
    ) pc
    group by pc.purchase_order_id
  ),

  po_recipes_per_po as (
    select
      pr.purchase_order_id,
      jsonb_agg(to_jsonb(pr) order by pr.po_recipe_id) as po_recipes_json,
      array_agg(pr.recipe_id) filter (where pr.recipe_id is not null) as recipe_ids
    from po_recipes pr
    where pr.purchase_order_id = any(v_po_ids)
    group by pr.purchase_order_id
  ),

  recipes_for_page as (
    select r.*
    from recipes r
    where r.recipe_id in (
      select distinct recipe_id
      from po_recipes
      where purchase_order_id = any(v_po_ids)
    )
  ),

  recipe_elements_for_page as (
    select re.*
    from recipe_elements re
    where re.recipe_id in (select recipe_id from recipes_for_page)
  ),

  per_po_recipes_json as (
    select
      p.purchase_order_id,
      coalesce(p.po_recipes_json, '[]'::jsonb) as po_recipes_json,
      coalesce(
        (
          select jsonb_agg(to_jsonb(r) order by r.recipe_id)
          from recipes_for_page r
          where r.recipe_id = any(p.recipe_ids)
        ),
        '[]'::jsonb
      ) as recipes_json,
      coalesce(
        (
          select jsonb_agg(to_jsonb(re) order by re.recipe_element_id)
          from recipe_elements_for_page re
          where re.recipe_id = any(p.recipe_ids)
        ),
        '[]'::jsonb
      ) as recipe_elements_json
    from po_recipes_per_po p
  ),

  -- Enrich po_raw_lines with key product fields for UI display.
  po_raw_lines_with_products as (
    select
      prl.*,
      p.name as product_name,
      p.upc as product_upc,
      p.item_num as product_item_num,
      p.default_units_per_case as product_default_units_per_case
    from po_raw_lines prl
    left join products p on p.product_id = prl.product_id
    where prl.purchase_order_id = any(v_po_ids)
  ),

  po_raw_lines_per_po as (
    select
      prl.purchase_order_id,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'po_raw_line_id', prl.po_raw_line_id,
            'purchase_order_id', prl.purchase_order_id,
            'product_id', prl.product_id,
            'invoice_id', prl.invoice_id,
            'total_units', prl.total_units,
            'status', prl.status,
            'notes', prl.notes,
            'product_name', prl.product_name,
            'upc', prl.product_upc,
            'item_num', prl.product_item_num,
            'default_units_per_case', prl.product_default_units_per_case
          ) order by prl.po_raw_line_id
        ),
        '[]'::jsonb
      ) as po_raw_lines_json
    from po_raw_lines_with_products prl
    group by prl.purchase_order_id
  ),

  po_raw_lines_per_invoice as (
    select
      prl.invoice_id,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'po_raw_line_id', prl.po_raw_line_id,
            'purchase_order_id', prl.purchase_order_id,
            'product_id', prl.product_id,
            'invoice_id', prl.invoice_id,
            'total_units', prl.total_units,
            'status', prl.status,
            'notes', prl.notes,
            'product_name', prl.product_name,
            'upc', prl.product_upc,
            'item_num', prl.product_item_num,
            'default_units_per_case', prl.product_default_units_per_case
          ) order by prl.po_raw_line_id
        ),
        '[]'::jsonb
      ) as po_raw_lines_json
    from po_raw_lines_with_products prl
    where prl.invoice_id is not null
    group by prl.invoice_id
  ),

  invoices_per_po as (
    select
      i.purchase_order_id,
      coalesce(
        jsonb_agg(
          (
            to_jsonb(i)
            || jsonb_build_object('po_raw_lines', coalesce(prli.po_raw_lines_json, '[]'::jsonb))
          )
          order by i.invoice_id
        ),
        '[]'::jsonb
      ) as invoices_json
    from invoices i
    left join po_raw_lines_per_invoice prli on prli.invoice_id = i.invoice_id
    where i.purchase_order_id = any(v_po_ids)
    group by i.purchase_order_id
  ),

  all_boxes_agg as (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'case_id', c.case_id,
        'purchase_order_id', c.purchase_order_id,
        'product_id', c.product_id,
        'product_name', c.product_name,
        'units_per_case', c.units_per_case,
        'status', c.status,
        'location_id', c.location_id,
        'request_id', c.request_id,
        'date_received', c.date_received,
        'notes', c.notes,
        'item_num', c.product_item_num,
        'upc', c.product_upc
      ) order by c.case_id
    ), '[]'::jsonb) as j
    from po_cases c
    where coalesce(nullif(c.product_fnsku, ''), nullif(c.product_asin, '')) is null
  ),

  all_boxes_ids_agg as (
    select coalesce(jsonb_agg(c.case_id order by c.case_id), '[]'::jsonb) as j
    from po_cases c
    where coalesce(nullif(c.product_fnsku, ''), nullif(c.product_asin, '')) is null
  ),

  all_po_recipes_agg as (
    select coalesce(jsonb_agg(
      jsonb_build_object(
        'po_recipe_id', pr.po_recipe_id,
        'purchase_order_id', pr.purchase_order_id,
        'recipe_id', pr.recipe_id,
        'qty', pr.qty
      ) order by pr.po_recipe_id
    ), '[]'::jsonb) as j
    from po_recipes pr
    where pr.purchase_order_id = any(v_po_ids)
  ),

  all_po_recipes_ids_agg as (
    select coalesce(jsonb_agg(pr.po_recipe_id order by pr.po_recipe_id), '[]'::jsonb) as j
    from po_recipes pr
    where pr.purchase_order_id = any(v_po_ids)
  ),

  all_recipes_agg as (
    select coalesce(jsonb_agg(to_jsonb(r) order by r.recipe_id), '[]'::jsonb) as j
    from recipes_for_page r
  ),

  all_recipe_elements_agg as (
    select coalesce(jsonb_agg(to_jsonb(re) order by re.recipe_element_id), '[]'::jsonb) as j
    from recipe_elements_for_page re
  ),

  all_products_agg as (
    select coalesce(jsonb_agg(to_jsonb(p) order by p.product_id), '[]'::jsonb) as j
    from products p
    where p.product_id in (select distinct product_id from po_cases)
       or p.product_id in (select distinct product_id from recipe_elements_for_page)
       or p.product_id in (select distinct product_id from po_raw_lines_with_products)
  ),

  all_products_ids_agg as (
    select coalesce(jsonb_agg(distinct product_id order by product_id), '[]'::jsonb) as j
    from (
      select product_id from po_cases
      union
      select product_id from recipe_elements_for_page
      union
      select product_id from po_raw_lines_with_products
    ) product_ids
  ),

  all_po_raw_lines_agg as (
    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'po_raw_line_id', prl.po_raw_line_id,
            'purchase_order_id', prl.purchase_order_id,
            'product_id', prl.product_id,
            'invoice_id', prl.invoice_id,
            'total_units', prl.total_units,
            'status', prl.status,
            'notes', prl.notes,
            'product_name', prl.product_name,
            'upc', prl.product_upc,
            'item_num', prl.product_item_num,
            'default_units_per_case', prl.product_default_units_per_case
          ) order by prl.po_raw_line_id
        ),
        '[]'::jsonb
      ) as j
    from po_raw_lines_with_products prl
  ),

      all_po_raw_lines_ids_agg as (
        select coalesce(jsonb_agg(prl.po_raw_line_id order by prl.po_raw_line_id), '[]'::jsonb) as j
        from po_raw_lines_with_products prl
      ),

  all_invoices_agg as (
    select coalesce(
      jsonb_agg(
        (
          to_jsonb(i)
          || jsonb_build_object('po_raw_lines', coalesce(prli.po_raw_lines_json, '[]'::jsonb))
        )
        order by i.invoice_id
      ),
      '[]'::jsonb
    ) as j
    from invoices i
    left join po_raw_lines_per_invoice prli on prli.invoice_id = i.invoice_id
    where i.purchase_order_id = any(v_po_ids)
      ),

      all_invoices_ids_agg as (
        select coalesce(jsonb_agg(i.invoice_id order by i.invoice_id), '[]'::jsonb) as j
        from invoices i
        where i.purchase_order_id = any(v_po_ids)
  )

  select jsonb_build_object(
    'total_count', v_total_count,
    'page', in_page,
    'rows_per_page', in_rows_per_page,
    'purchase_orders',
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'purchase_order_id', sp.purchase_order_id,
            'purchase_order_name', sp.purchase_order_name,
            'vendor_id', sp.vendor_id,
            'date_ordered', sp.date_ordered,
            'date_received', sp.date_received,
            'notes', sp.notes,
            'status', sp.status,
            'discount', sp.discount,
            'vendor_name', v.vendor_name,
            'grouped_cases', coalesce(gc.grouped_cases_json, '[]'::jsonb),
            'grouped_boxes', coalesce(gb.grouped_boxes_json, '[]'::jsonb),
            'individual_boxes', coalesce(ib.individual_boxes_json, '[]'::jsonb),
            'po_recipes', coalesce(pr.po_recipes_json, '[]'::jsonb),
            'recipes', coalesce(pr.recipes_json, '[]'::jsonb),
            'recipe_elements', coalesce(pr.recipe_elements_json, '[]'::jsonb),
            'po_raw_lines', coalesce(prl.po_raw_lines_json, '[]'::jsonb),
            'invoices', coalesce(pi.invoices_json, '[]'::jsonb)
          ) order by array_position(v_po_ids, sp.purchase_order_id)
        ),
        '[]'::jsonb
      ),
    'all_boxes', (select j from all_boxes_agg),
    'all_po_recipes', (select j from all_po_recipes_agg),
    'all_recipes', (select j from all_recipes_agg),
    'all_recipe_elements', (select j from all_recipe_elements_agg),
    'all_products', (select j from all_products_agg),
    'all_po_raw_lines', (select j from all_po_raw_lines_agg),
    'all_invoices', (select j from all_invoices_agg),
    'all_boxes_ids', (select j from all_boxes_ids_agg),
    'all_po_recipes_ids', (select j from all_po_recipes_ids_agg),
    'all_products_ids', (select j from all_products_ids_agg),
    'all_po_raw_lines_ids', (select j from all_po_raw_lines_ids_agg),
    'all_invoices_ids', (select j from all_invoices_ids_agg),
    'purchase_order_ids', to_jsonb(v_po_ids)
  )
  into v_result
  from selected_pos sp
  left join vendors v on v.vendor_id = sp.vendor_id
  left join grouped_cases gc on gc.purchase_order_id = sp.purchase_order_id
  left join grouped_boxes gb on gb.purchase_order_id = sp.purchase_order_id
  left join individual_boxes_agg ib on ib.purchase_order_id = sp.purchase_order_id
  left join per_po_recipes_json pr on pr.purchase_order_id = sp.purchase_order_id
  left join po_raw_lines_per_po prl on prl.purchase_order_id = sp.purchase_order_id
  left join invoices_per_po pi on pi.purchase_order_id = sp.purchase_order_id;

  return v_result;
end;
$function$;
