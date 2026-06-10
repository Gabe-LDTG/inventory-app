create or replace function public.bulk_create_po_raw_lines(
    record_array jsonb
) returns SETOF public.po_raw_lines
language plpgsql
as $function$
declare
    line_entry jsonb;

    v_product_id bigint;
    v_purchase_order_id bigint;
    v_invoice_id bigint;
    v_total_units numeric;
    v_fbm numeric;
    v_fba_prep numeric;
    v_store numeric;
    v_notes text;
    v_status text;

    raw_line_twin_id bigint;
    resulting_raw_line public.po_raw_lines%rowtype;
begin
    if record_array is null or jsonb_typeof(record_array) <> 'array' then
        raise exception 'record_array must be a JSON array of raw line objects';
    end if;

    for line_entry in
        select value
        from jsonb_array_elements(record_array)
    loop
        if jsonb_typeof(line_entry) <> 'object' then
            raise exception 'Each raw line entry must be an object. Got: %', jsonb_typeof(line_entry);
        end if;

        -- 1. Reset loop variables safely
        raw_line_twin_id := null;

        v_product_id := nullif(line_entry->>'product_id', '')::bigint;
        v_purchase_order_id := nullif(line_entry->>'purchase_order_id', '')::bigint;
        v_invoice_id := nullif(line_entry->>'invoice_id', '')::bigint;
        v_total_units := nullif(line_entry->>'total_units', '')::numeric;
        v_fbm := nullif(line_entry->>'fbm', '')::numeric;
        v_fba_prep := nullif(line_entry->>'fba_prep', '')::numeric;
        v_store := nullif(line_entry->>'store', '')::numeric;
        v_notes := nullif(line_entry->>'notes', '');
        v_status := nullif(line_entry->>'status', '');

        -- raise exception 'Debug: Found twin raw line with ID % for product_id %, purchase_order_id %, invoice_id %, status %', raw_line_twin_id, v_product_id, v_purchase_order_id, v_invoice_id, v_status;

        -- 2. LOOK FOR THE TWIN FIRST, BEFORE CHANGING THE DATABASE STATE
        select prl.po_raw_line_id
          into raw_line_twin_id
        from public.po_raw_lines prl
        where prl.product_id = v_product_id
          and prl.purchase_order_id = v_purchase_order_id
          and prl.invoice_id is not distinct from v_invoice_id
          and prl.status is not distinct from v_status
        order by prl.po_raw_line_id ASC
        limit 1
        for update;

        -- raise exception 'Debug: Found twin raw line with ID % for product_id %, purchase_order_id %, invoice_id %, status %', raw_line_twin_id, v_product_id, v_purchase_order_id, v_invoice_id, v_status;

        -- 3. CONSOLIDATION LOGIC
        if raw_line_twin_id is not null then
          -- A twin exists: Update the mathematical values on the existing row directly using variables
          update public.po_raw_lines target
          set 
              total_units = coalesce(target.total_units, 0) + coalesce(v_total_units, 0),
              fbm         = coalesce(target.fbm, 0)         + coalesce(v_fbm, 0),
              fba_prep    = coalesce(target.fba_prep, 0)    + coalesce(v_fba_prep, 0),
              store       = coalesce(target.store, 0)       + coalesce(v_store, 0),
              notes       = coalesce(target.notes, v_notes)
          where target.po_raw_line_id = raw_line_twin_id
          returning * into resulting_raw_line;

          return next resulting_raw_line;
        else
          -- No twin exists: Perform a standard fresh insert
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
          ) values (
              v_product_id,
              v_purchase_order_id,
              v_invoice_id,
              v_total_units,
              v_store,
              v_fbm,
              v_fba_prep,
              v_notes,
              v_status
          ) returning * into resulting_raw_line;

          return next resulting_raw_line;
        end if;
    end loop;
    return;
end;
$function$;

create or replace function public.edit_po_raw_line(
    received_raw_line_data jsonb
) returns RECORD
language plpgsql
as $function$
declare
    line_entry jsonb;

    v_po_raw_line_id bigint;
    v_product_id bigint;
    v_purchase_order_id bigint;
    v_invoice_id bigint;
    v_total_units numeric;
    v_fbm numeric;
    v_fba_prep numeric;
    v_store numeric;
    v_notes text;
    v_status text;
    raw_line_twin_id bigint;
    new_raw_line RECORD;

    resulting_raw_line RECORD;

begin
    if jsonb_typeof(received_raw_line_data) <> 'object' then
        raise exception 'Each raw line entry must be an object. Got: %', jsonb_typeof(received_raw_line_data);
    end if;

    v_po_raw_line_id := nullif(received_raw_line_data->>'po_raw_line_id', '')::bigint;
    v_product_id := nullif(received_raw_line_data->>'product_id', '')::bigint;
    v_purchase_order_id := nullif(received_raw_line_data->>'purchase_order_id', '')::bigint;
    v_invoice_id := nullif(received_raw_line_data->>'invoice_id', '')::bigint;
    v_total_units := nullif(received_raw_line_data->>'total_units', '')::numeric;
    v_fbm := nullif(received_raw_line_data->>'fbm', '')::numeric;
    v_fba_prep := nullif(received_raw_line_data->>'fba_prep', '')::numeric;
    v_store := nullif(received_raw_line_data->>'store', '')::numeric;
    v_notes := nullif(received_raw_line_data->>'notes', '');
    v_status := nullif(received_raw_line_data->>'status', '');

    -- 2. LOOK FOR THE TWIN FIRST, BEFORE CHANGING THE DATABASE STATE
    select prl.po_raw_line_id
        into raw_line_twin_id
    from public.po_raw_lines prl
    where prl.product_id = v_product_id
        and prl.purchase_order_id = v_purchase_order_id
        and prl.invoice_id is not distinct from v_invoice_id
        and prl.status is not distinct from v_status
    order by prl.po_raw_line_id ASC
    limit 1
    for update;
    

    if raw_line_twin_id is not null then
        -- A twin exists: Update the mathematical values on the existing row directly using variables
        update public.po_raw_lines target
        set 
            total_units = coalesce(target.total_units, 0) + coalesce(v_total_units, 0),
            fbm         = coalesce(target.fbm, 0)         + coalesce(v_fbm, 0),
            fba_prep    = coalesce(target.fba_prep, 0)    + coalesce(v_fba_prep, 0),
            store       = coalesce(target.store, 0)       + coalesce(v_store, 0),
            notes       = concat(target.notes, ' | ', v_notes)
        where target.po_raw_line_id = raw_line_twin_id
        returning * into resulting_raw_line;

        delete from public.po_raw_lines
        where po_raw_line_id = v_po_raw_line_id;

    else
        -- No twin exists: Perform a standard fresh update
        update public.po_raw_lines target
        set 
            total_units = coalesce(v_total_units, 0),
            fbm         = coalesce(v_fbm, 0),
            fba_prep    = coalesce(v_fba_prep, 0),
            store       = coalesce(v_store, 0),
            notes       = nullif(v_notes, '')
        where target.po_raw_line_id = v_po_raw_line_id
        returning * into resulting_raw_line;
    END IF;

    RETURN resulting_raw_line;

end;
$function$;