-- This migration will create the necessary function(s) to consolidate po_raw_lines being inbounded that share the same product_id, po_id, invoice, and status
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