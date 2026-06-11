CREATE OR REPLACE FUNCTION public._get_purchase_order_ids_helper(in_page integer, in_rows_per_page integer, in_filter_field text, in_filter_data text, in_sort_field text, in_sort_order integer)
 RETURNS TABLE(total_count bigint, po_ids bigint[])
 LANGUAGE plpgsql
 STABLE
AS $function$DECLARE
  v_offset integer := GREATEST((in_page - 1), 0) * GREATEST(in_rows_per_page, 1);
  v_field text := 'purchase_order_id';
  v_sort text := 'ASC';
  v_sql text;
BEGIN
  -- RAISE EXCEPTION 'CHECKING INPUTS IN HELPER - in_page %, in_rows_per_page %, in_filter_field %,  in_filter_data %,  in_sort_field %,  in_sort_order %', in_page, in_rows_per_page, in_filter_field,  in_filter_data,  in_sort_field,  in_sort_order;
  -- normalize sort order
  IF in_sort_order = -1 THEN
    v_sort := 'DESC';
  END IF;

  -- whitelist allowed fields for filter and sort (adjust list as needed)
  IF in_sort_field IN ('purchase_order_id','purchase_order_name','date_ordered','date_received','vendor_id','status', 'notes') THEN
    v_field := in_sort_field;
  ELSE
    v_field := 'purchase_order_id';
  END IF;

  -- If no filter provided -> simpler path
  IF in_filter_data IS NULL OR btrim(in_filter_data) = '' THEN
    -- total count
    SELECT count(*) INTO total_count FROM purchase_orders;

    -- build SQL to get array of ids in requested order + page
    v_sql := format($f$
      SELECT array_agg(p.purchase_order_id ORDER BY p.%I %s)
      FROM (
        SELECT *
        FROM purchase_orders
        ORDER BY %I %s, purchase_order_id ASC
        OFFSET $1 LIMIT $2
      ) p
    $f$, v_field, v_sort, v_field, v_sort);

    EXECUTE v_sql USING v_offset, in_rows_per_page INTO po_ids;

      -- RAISE EXCEPTION 'IN HELPER - total count: % and po ids: %', total_count, po_ids;
    RETURN NEXT;
    RETURN;
  END IF;

  -- RAISE EXCEPTION 'IN HELPER - WENT PAST IF';

  -- Filtered path: count and page with filter. Use parameterized USING for the filter value.
  v_sql := $q$
    SELECT count(*) FROM purchase_orders po
    WHERE (CASE
            WHEN $1 = 'purchase_order_name' THEN po.purchase_order_name ILIKE $2
            WHEN $1 = 'notes' THEN coalesce(po.notes,'') ILIKE $2
            WHEN $1 = 'vendor_id' THEN ($3 ~ '^\d+$' AND po.vendor_id = $3::bigint)
            ELSE po.purchase_order_name ILIKE $2 OR coalesce(po.notes,'') ILIKE $2
          END);
  $q$;

EXECUTE v_sql USING in_filter_field, ('%' || in_filter_data || '%'), in_filter_data INTO total_count;

  -- Build SQL for paging with filter; note we still use a CASE in WHERE constructed safely by enumerating allowed filter fields
  IF in_filter_field = 'purchase_order_name' THEN
    v_sql := format($f$
      SELECT array_agg(p.purchase_order_id ORDER BY p.%I %s)
      FROM (
        SELECT *
        FROM purchase_orders po
        WHERE po.purchase_order_name ILIKE $1
        ORDER BY %I %s, purchase_order_id ASC
        OFFSET $2 LIMIT $3
      ) p
    $f$, v_field, v_sort, v_field, v_sort);

    EXECUTE v_sql USING ('%' || in_filter_data || '%'), v_offset, in_rows_per_page INTO po_ids;

  ELSIF in_filter_field = 'notes' THEN
    v_sql := format($f$
      SELECT array_agg(p.purchase_order_id ORDER BY p.%I %s)
      FROM (
        SELECT *
        FROM purchase_orders po
        WHERE coalesce(po.notes,'') ILIKE $1
        ORDER BY %I %s, purchase_order_id ASC
        OFFSET $2 LIMIT $3
      ) p
    $f$, v_field, v_sort, v_field, v_sort);

    EXECUTE v_sql USING ('%' || in_filter_data || '%'), v_offset, in_rows_per_page INTO po_ids;

  ELSIF in_filter_field = 'vendor_id' THEN
    v_sql := format($f$
      SELECT array_agg(p.purchase_order_id ORDER BY p.%I %s)
      FROM (
        SELECT *
        FROM purchase_orders po
        WHERE ($1 ~ '^\d+$' AND po.vendor_id = $1::bigint)
        ORDER BY %I %s, purchase_order_id ASC
        OFFSET $2 LIMIT $3
      ) p
    $f$, v_field, v_sort, v_field, v_sort);

    EXECUTE v_sql USING in_filter_data, v_offset, in_rows_per_page INTO po_ids;

  ELSE
    -- default: search both name and notes
    v_sql := format($f$
      SELECT array_agg(p.purchase_order_id ORDER BY p.%I %s)
      FROM (
        SELECT *
        FROM purchase_orders po
        WHERE po.purchase_order_name ILIKE $1 OR coalesce(po.notes,'') ILIKE $1
        ORDER BY %I %s, purchase_order_id ASC
        OFFSET $2 LIMIT $3
      ) p
    $f$, v_field, v_sort, v_field, v_sort);

    EXECUTE v_sql USING ('%' || in_filter_data || '%'), v_offset, in_rows_per_page INTO po_ids;
  END IF;

  RETURN NEXT;
  RETURN;
END;$function$
