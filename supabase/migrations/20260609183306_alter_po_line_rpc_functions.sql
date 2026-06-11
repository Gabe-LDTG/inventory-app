-- This migration will alter the existing bulk_edit_raw_lines function to accommodate the three new fields added to po_raw_lines in the previous migration (store, fbm, and fba_prep). The function will be updated to allow editing of these new fields for each raw line entry.
-- -- This function takes a JSONB object containing an array of raw line data. It updates each raw line based on the provided data
create or replace function public.bulk_edit_raw_lines(
    received_raw_line_data jsonb
) returns void
language plpgsql
as $function$
declare
    line_entry jsonb;
    i integer;

    v_po_raw_line_id bigint;
    v_product_id bigint;
    v_purchase_order_id bigint;
    v_invoice_id bigint;
    v_total_units numeric;
    v_store numeric;
    v_fbm numeric;
    v_fba_prep numeric;
    v_notes text;
    v_status text;
    raw_line_twin_id bigint;

begin
    if received_raw_line_data is null or jsonb_typeof(received_raw_line_data) <> 'array' then
        raise exception 'received_raw_line_data must be a JSON array of raw line objects';
    end if;

    for line_entry in
        select value
        from jsonb_array_elements(received_raw_line_data)
    loop
        if jsonb_typeof(line_entry) <> 'object' then
            raise exception 'Each raw line entry must be an object. Got: %', jsonb_typeof(line_entry);
        end if;

        if not (line_entry ? 'po_raw_line_id') then
            raise exception 'Each raw line entry must include po_raw_line_id. Entry: %', line_entry;
        end if;

        v_po_raw_line_id := nullif(line_entry->>'po_raw_line_id', '')::bigint;

        if v_po_raw_line_id is null then
            raise exception 'po_raw_line_id must be a non-null value. Entry: %', line_entry;
        end if;

        v_product_id := nullif(line_entry->>'product_id', '')::bigint;
        v_purchase_order_id := nullif(line_entry->>'purchase_order_id', '')::bigint;
        v_invoice_id := nullif(line_entry->>'invoice_id', '')::bigint;
        v_total_units := nullif(line_entry->>'total_units', '')::numeric;
        v_store := nullif(line_entry->>'store', '')::numeric;
        v_fbm := nullif(line_entry->>'fbm', '')::numeric;
        v_fba_prep := nullif(line_entry->>'fba_prep', '')::numeric;
        v_notes := nullif(line_entry->>'notes', '');
        v_status := nullif(line_entry->>'status', '');

        update po_raw_lines
        set
            product_id = coalesce(v_product_id, product_id),
            purchase_order_id = coalesce(v_purchase_order_id, purchase_order_id),
            invoice_id = coalesce(v_invoice_id, invoice_id),
            total_units = coalesce(v_total_units, total_units),
            store = coalesce(v_store, store),
            fbm = coalesce(v_fbm, fbm),
            fba_prep = coalesce(v_fba_prep, fba_prep),
            notes = coalesce(v_notes, notes),
            status = coalesce(v_status, status)
        where po_raw_line_id = v_po_raw_line_id;

        -- Now we want to find any "twin" raw lines that share the same product_id, po_id, invoice_id, and status (these are the fields that define a duplicate raw line that should be consolidated)
        IF v_status = 'Delivered' THEN
            SELECT po_raw_line_id INTO raw_line_twin_id
            FROM po_raw_lines
            WHERE po_raw_line_id != v_po_raw_line_id
                AND product_id = v_product_id
                AND purchase_order_id = v_purchase_order_id
                AND invoice_id = v_invoice_id
                AND status = v_status
            LIMIT 1;

            -- If we found a twin, we want to consolidate the two lines by summing their total_units and then deleting the newly updated line, since the twin existed first
            IF raw_line_twin_id IS NOT NULL THEN
                UPDATE po_raw_lines
                SET total_units = total_units + v_total_units
                WHERE po_raw_line_id = raw_line_twin_id;

                DELETE FROM po_raw_lines
                WHERE po_raw_line_id = v_po_raw_line_id;
            END IF;
        END IF;

    end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.bulk_create_po_raw_lines(record_array jsonb)
 RETURNS SETOF po_raw_lines
 LANGUAGE plpgsql
AS $function$
begin
  if record_array is null or jsonb_typeof(record_array) <> 'array' then
    raise exception 'record_array must be a JSON array';
  end if;

  return query
  with parsed_rows as (
    select
      (row_value->>'product_id')::bigint as product_id,
      (row_value->>'purchase_order_id')::bigint as purchase_order_id,
      nullif(row_value->>'invoice_id', '')::bigint as invoice_id,
      (row_value->>'total_units')::numeric as total_units,
      (row_value->>'store')::numeric as store,
      (row_value->>'fbm')::numeric as fbm,
      (row_value->>'fba_prep')::numeric as fba_prep,
      nullif(row_value->>'notes', '')::text as notes,
      (row_value->>'status')::text as status
    from jsonb_array_elements(record_array) as row_value
  )
  insert into public.po_raw_lines (
    product_id,
    purchase_order_id,
    invoice_id,
    total_units,
    store,
    fbm,
    fba_prep,
    notes,
    status
  )
  select
    parsed_rows.product_id,
    parsed_rows.purchase_order_id,
    parsed_rows.invoice_id,
    parsed_rows.total_units,
    parsed_rows.store,
    parsed_rows.fbm,
    parsed_rows.fba_prep,
    parsed_rows.notes,
    parsed_rows.status
  from parsed_rows
  returning *;
end;
$function$
