-- This migration creates the "bulk_edit_raw_lines" function
-- This function takes a JSONB object containing an array of raw line data. It updates each raw line based on the provided data
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
    v_total_units integer;
    v_notes text;
    v_status text;

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
        v_total_units := nullif(line_entry->>'total_units', '')::integer;
        v_notes := nullif(line_entry->>'notes', '');
        v_status := nullif(line_entry->>'status', '');

        update po_raw_lines
        set
            product_id = coalesce(v_product_id, product_id),
            purchase_order_id = coalesce(v_purchase_order_id, purchase_order_id),
            invoice_id = coalesce(v_invoice_id, invoice_id),
            total_units = coalesce(v_total_units, total_units),
            notes = coalesce(v_notes, notes),
            status = coalesce(v_status, status)
        where po_raw_line_id = v_po_raw_line_id;
    end loop;
end;
$function$;