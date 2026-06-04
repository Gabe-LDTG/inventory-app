-- This migration creates the "create_multiple_cases_by_type" function
-- This function takes a JSONB object containing an array of cases separated by product type and units per case. It creates cases for each product type based on the amount field
create or replace function public.create_multiple_cases_by_type(
    received_box_data jsonb
) returns void
language plpgsql
as $function$
declare
    case_entry jsonb;
    i integer;

    v_product_id bigint;
    v_units_per_case integer;
    v_amount integer;

    v_date_received date;
    v_notes text;
    v_location_id bigint;
    v_status text;
    v_purchase_order_id bigint;
    v_request_id bigint;
    v_invoice_id bigint;
begin
    if received_box_data is null or jsonb_typeof(received_box_data) <> 'array' then
        raise exception 'received_box_data must be a JSON array of case objects';
    end if;

    for case_entry in
        select value
        from jsonb_array_elements(received_box_data)
    loop
        if jsonb_typeof(case_entry) <> 'object' then
            raise exception 'Each case entry must be an object. Got: %', jsonb_typeof(case_entry);
        end if;

        if not (case_entry ? 'product_id' and case_entry ? 'units_per_case' and case_entry ? 'amount') then
            raise exception 'Each case entry must include product_id, units_per_case, and amount. Entry: %', case_entry;
        end if;

        v_product_id := nullif(case_entry->>'product_id', '')::bigint;
        v_units_per_case := nullif(case_entry->>'units_per_case', '')::integer;
        v_amount := nullif(case_entry->>'amount', '')::integer;

        if v_product_id is null or v_units_per_case is null or v_amount is null then
            raise exception 'product_id, units_per_case, and amount must be non-null values. Entry: %', case_entry;
        end if;

        if v_amount < 0 then
            raise exception 'amount cannot be negative. Entry: %', case_entry;
        end if;

        if v_units_per_case <= 0 then
            raise exception 'units_per_case must be greater than zero. Entry: %', case_entry;
        end if;

        v_date_received := coalesce(nullif(case_entry->>'date_received', '')::date, current_date);
        v_notes := nullif(case_entry->>'notes', '');
        v_location_id := nullif(case_entry->>'location_id', '')::bigint;
        v_status := nullif(case_entry->>'status', '');
        v_purchase_order_id := nullif(case_entry->>'purchase_order_id', '')::bigint;
        v_request_id := nullif(case_entry->>'request_id', '')::bigint;
        v_invoice_id := nullif(case_entry->>'invoice_id', '')::bigint;

        for i in 1..v_amount loop
            insert into public.cases (
                units_per_case,
                date_received,
                notes,
                product_id,
                location_id,
                status,
                purchase_order_id,
                request_id,
                invoice_id
            ) values (
                v_units_per_case,
                v_date_received,
                v_notes,
                v_product_id,
                v_location_id,
                v_status,
                v_purchase_order_id,
                v_request_id,
                v_invoice_id
            );
        end loop;
    end loop;
end;
$function$;
