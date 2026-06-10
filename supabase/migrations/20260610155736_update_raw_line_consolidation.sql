-- This migration consolidates the three new fields added to po_raw_lines (store, fbm, and fba_prep) into a single JSONB column called raw_line_consolidation. This will allow for more flexible storage of these related fields and simplify future additions or changes to the raw line data structure without needing to alter the table schema again. The existing data from the three new fields will be migrated into the raw_line_consolidation column in a structured format.
-- It also adds consolidations to the add functions for po_raw_lines to ensure that any new entries will also have the consolidated data stored in the new JSONB column. 
create or replace function public.bulk_edit_raw_lines(
    received_raw_line_data jsonb
) returns void
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
        v_fbm := nullif(line_entry->>'fbm', '')::numeric;
        v_fba_prep := nullif(line_entry->>'fba_prep', '')::numeric;
        v_store := nullif(line_entry->>'store', '')::numeric;
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
            -- Also consolidate the fbm, fba_prep, and store fields, as they will separate through receiving
            IF raw_line_twin_id IS NOT NULL THEN
                UPDATE po_raw_lines
                SET 
                    total_units = total_units + v_total_units,
                    fbm = coalesce(fbm, 0) + coalesce(v_fbm, 0),
                    fba_prep = coalesce(fba_prep, 0) + coalesce(v_fba_prep, 0),
                    store = coalesce(store, 0) + coalesce(v_store, 0)
                WHERE po_raw_line_id = raw_line_twin_id;

                DELETE FROM po_raw_lines
                WHERE po_raw_line_id = v_po_raw_line_id;
            END IF;
        END IF;

    end loop;
end;
$function$;

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
    new_raw_line RECORD;

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

        v_product_id := nullif(line_entry->>'product_id', '')::bigint;
        v_purchase_order_id := nullif(line_entry->>'purchase_order_id', '')::bigint;
        v_invoice_id := nullif(line_entry->>'invoice_id', '')::bigint;
        v_total_units := nullif(line_entry->>'total_units', '')::numeric;
        v_fbm := nullif(line_entry->>'fbm', '')::numeric;
        v_fba_prep := nullif(line_entry->>'fba_prep', '')::numeric;
        v_store := nullif(line_entry->>'store', '')::numeric;
        v_notes := nullif(line_entry->>'notes', '');
        v_status := nullif(line_entry->>'status', '');

        INSERT INTO po_raw_lines (
            product_id,
            purchase_order_id,
            invoice_id,
            total_units,
            store,
            fbm,
            fba_prep,
            notes,
            status
        )VALUES(
            v_product_id,
            v_purchase_order_id,
            v_invoice_id,
            v_total_units,
            v_store,
            v_fbm,
            v_fba_prep,
            v_notes,
            v_status
        ) RETURNING * INTO new_raw_line;

        -- Now we want to find any "twin" raw lines that share the same product_id, po_id, invoice_id, and status (these are the fields that define a duplicate raw line that should be consolidated)
        SELECT po_raw_line_id INTO raw_line_twin_id
        FROM po_raw_lines
        WHERE po_raw_line_id != new_raw_line.po_raw_line_id
            AND product_id = v_product_id
            AND purchase_order_id = v_purchase_order_id
            AND invoice_id = v_invoice_id
            AND status = v_status
        LIMIT 1;

        -- If we found a twin, we want to consolidate the two lines by summing their total_units and then deleting the newly updated line, since the twin existed first
        -- Also consolidate the fbm, fba_prep, and store fields, as they will separate through receiving
        IF raw_line_twin_id IS NOT NULL THEN
            UPDATE po_raw_lines
            SET 
                total_units = total_units + v_total_units,
                fbm = coalesce(fbm, 0) + coalesce(v_fbm, 0),
                fba_prep = coalesce(fba_prep, 0) + coalesce(v_fba_prep, 0),
                store = coalesce(store, 0) + coalesce(v_store, 0)
            WHERE po_raw_line_id = raw_line_twin_id;

            DELETE FROM po_raw_lines
            WHERE po_raw_line_id = new_raw_line.po_raw_line_id;
        END IF;


    end loop;
end;
$function$;

create or replace function public.create_po_raw_line(
    received_raw_line_data jsonb
) returns RECORD
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
    new_raw_line RECORD;

    returning_line RECORD;

begin
    if jsonb_typeof(received_raw_line_data) <> 'object' then
        raise exception 'Each raw line entry must be an object. Got: %', jsonb_typeof(received_raw_line_data);
    end if;

    v_product_id := nullif(received_raw_line_data->>'product_id', '')::bigint;
    v_purchase_order_id := nullif(received_raw_line_data->>'purchase_order_id', '')::bigint;
    v_invoice_id := nullif(received_raw_line_data->>'invoice_id', '')::bigint;
    v_total_units := nullif(received_raw_line_data->>'total_units', '')::numeric;
    v_fbm := nullif(received_raw_line_data->>'fbm', '')::numeric;
    v_fba_prep := nullif(received_raw_line_data->>'fba_prep', '')::numeric;
    v_store := nullif(received_raw_line_data->>'store', '')::numeric;
    v_notes := nullif(received_raw_line_data->>'notes', '');
    v_status := nullif(received_raw_line_data->>'status', '');

    INSERT INTO po_raw_lines (
        product_id,
        purchase_order_id,
        invoice_id,
        total_units,
        store,
        fbm,
        fba_prep,
        notes,
        status
    )VALUES(
        v_product_id,
        v_purchase_order_id,
        v_invoice_id,
        v_total_units,
        v_store,
        v_fbm,
        v_fba_prep,
        v_notes,
        v_status
    ) RETURNING * INTO new_raw_line;

    -- Now we want to find any "twin" raw lines that share the same product_id, po_id, invoice_id, and status (these are the fields that define a duplicate raw line that should be consolidated)
    SELECT po_raw_line_id INTO raw_line_twin_id
    FROM po_raw_lines
    WHERE po_raw_line_id != new_raw_line.po_raw_line_id
        AND product_id = v_product_id
        AND purchase_order_id = v_purchase_order_id
        AND invoice_id = v_invoice_id
        AND status = v_status
    LIMIT 1;

    -- If we found a twin, we want to consolidate the two lines by summing their total_units and then deleting the newly updated line, since the twin existed first
    -- Also consolidate the fbm, fba_prep, and store fields, as they will separate through receiving
    IF raw_line_twin_id IS NOT NULL THEN
        UPDATE po_raw_lines
        SET 
            total_units = total_units + v_total_units,
            fbm = coalesce(fbm, 0) + coalesce(v_fbm, 0),
            fba_prep = coalesce(fba_prep, 0) + coalesce(v_fba_prep, 0),
            store = coalesce(store, 0) + coalesce(v_store, 0)
        WHERE po_raw_line_id = raw_line_twin_id;

        DELETE FROM po_raw_lines
        WHERE po_raw_line_id = new_raw_line.po_raw_line_id;
    END IF;

    RETURN returning_line;

end;
$function$;

DROP FUNCTION IF EXISTS public.create_po_recipe(text[]);

CREATE OR REPLACE FUNCTION public.create_po_recipe(record_array JSONB)
 RETURNS po_recipes
 LANGUAGE plpgsql
AS $function$
DECLARE
  inserted_recipe public.po_recipes%ROWTYPE;
  merged_recipe public.po_recipes%ROWTYPE;
  twin_recipe_id bigint;

BEGIN
  INSERT INTO po_recipes (purchase_order_id, recipe_id, qty) VALUES (
    (record_array->>'purchase_order_id')::bigint, -- Purchase Order ID
    (record_array->>'recipe_id')::bigint, -- Recipe ID
    (record_array->>'qty')::integer -- Recipe qty
  ) RETURNING * INTO inserted_recipe;

    -- Check for a "twin" recipe with the same purchase_order_id and recipe_id
    SELECT po_recipe_id INTO twin_recipe_id
    FROM po_recipes
    WHERE po_recipe_id != inserted_recipe.po_recipe_id
        AND purchase_order_id = inserted_recipe.purchase_order_id
        AND recipe_id = inserted_recipe.recipe_id
    LIMIT 1;

    -- If a twin exists, consolidate by summing the qty and deleting the newly created recipe, since the twin existed first
    IF twin_recipe_id IS NOT NULL THEN
        UPDATE po_recipes
        SET qty = qty + inserted_recipe.qty
        WHERE po_recipe_id = twin_recipe_id
        RETURNING * INTO merged_recipe;

        DELETE FROM po_recipes
        WHERE po_recipe_id = inserted_recipe.po_recipe_id;

        -- Return the consolidated recipe
        RETURN merged_recipe;
    END IF;

  RETURN inserted_recipe;
END;
$function$
