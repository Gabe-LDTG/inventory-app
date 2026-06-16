-- Cleaning rpc functions for recipes, as we have changed the recipe table and want to make sure the functions are up to date
DROP FUNCTION IF EXISTS get_purchase_orders_with_details_3(in_page integer, in_rows_per_page integer, in_filter_data text);
DROP FUNCTION IF EXISTS get_purchase_orders_with_detailsold(in_page integer, in_rows_per_page integer, in_filter_field text, in_filter_data text, in_sort_field text, in_sort_order integer);

CREATE OR REPLACE FUNCTION public.create_product_key(new_product_data jsonb, new_recipe_data jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    new_product products;
    new_recipe recipes;
    recipe_label text;
    input_recipe_element jsonb;
BEGIN
    INSERT INTO products (
        name, 
        item_num, 
        vendor_id, 
        weight_lbs, 
        box_type, box_cost, 
        bag_size, bag_cost, 
        price_2021, price_2022, price_2023, 
        notes, 
        date_added, 
        upc, 
        fnsku, asin, 
        do_we_carry, 
        process_time_per_unit_sec, 
        meltable, 
        map, 
        in_shipping_cost, out_shipping_cost, labor_cost, item_cost, misc_cost, amz_fees_cost, amz_fulfilment_cost, 
        storage_cost_30_day, holiday_storage_cost, total_cost, total_holiday_cost, 
        default_units_per_case, status, unit_box_cost, is_processed)
    VALUES (
        new_product_data->>'name', 
        new_product_data->>'item_num', 
        nullif(new_product_data->>'vendor_id', '')::bigint, 
        nullif(new_product_data->>'weight_lbs', '')::integer, 
        new_product_data->>'box_type', 
        nullif(new_product_data->>'box_cost', '')::numeric, 
        new_product_data->>'bag_size',
        nullif(new_product_data->>'bag_cost', '')::numeric, 
        nullif(new_product_data->>'price_2021', '')::numeric, 
        nullif(new_product_data->>'price_2022', '')::numeric, 
        nullif(new_product_data->>'price_2023', '')::numeric, 
        new_product_data->>'notes', 
        nullif(new_product_data->>'date_added', '')::date, 
        new_product_data->>'upc', 
        new_product_data->>'fnsku', 
        new_product_data->>'asin', 
        new_product_data->>'do_we_carry', 
        nullif(new_product_data->>'process_time_per_unit_sec', '')::integer, 
        new_product_data->>'meltable', 
        nullif(new_product_data->>'map', '')::numeric, 
        nullif(new_product_data->>'in_shipping_cost', '')::numeric, 
        nullif(new_product_data->>'out_shipping_cost', '')::numeric, 
        nullif(new_product_data->>'labor_cost', '')::numeric, 
        nullif(new_product_data->>'item_cost', '')::numeric, 
        nullif(new_product_data->>'misc_cost', '')::numeric, 
        nullif(new_product_data->>'amz_fees_cost', '')::numeric, 
        nullif(new_product_data->>'amz_fulfilment_cost', '')::numeric, 
        nullif(new_product_data->>'storage_cost_30_day', '')::numeric, 
        nullif(new_product_data->>'holiday_storage_cost', '')::numeric, 
        nullif(new_product_data->>'total_cost', '')::numeric, 
        nullif(new_product_data->>'total_holiday_cost', '')::numeric, 
        nullif(new_product_data->>'default_units_per_case', '')::integer, 
        new_product_data->>'status', 
        nullif(new_product_data->>'unit_box_cost', '')::numeric, 
        (new_product_data->>'is_processed')::boolean
    ) RETURNING * INTO new_product;

    IF new_recipe_data IS NOT NULL AND new_product.is_processed IS TRUE THEN
        IF new_product.fnsku IS NULL THEN
            recipe_label := new_product.name;
        ELSE
            recipe_label := format('%s - %s', new_product.name, new_product.fnsku);
        END IF;
        

        -- RAISE EXCEPTION 'Recipe label: %', recipe_label;

        -- Create the recipe 
        INSERT INTO recipes (label, output_product_id, vendor_id) VALUES (
            recipe_label, new_product.product_id, new_product.vendor_id) RETURNING * INTO new_recipe;

        -- RAISE EXCEPTION 'Output element insert complete';
        FOR input_recipe_element IN
            SELECT value
            FROM jsonb_array_elements(new_recipe_data)
        LOOP

        -- Loop through the recipe array and create the input element(s)
        INSERT INTO recipe_elements (product_id, recipe_id, qty, type) VALUES (
            (input_recipe_element->>'product_id')::bigint, -- Input Product
            new_recipe.recipe_id, -- Linked Recipe Id
            (input_recipe_element->>'qty')::integer, -- Element QTY
            'input' -- Element Type
        );
        END LOOP;
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_product_key(updated_product_data jsonb, updated_recipe_data jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    updated_product products;
    recipe_id_value bigint;
    recipe_label text;
    current_recipe_label text;
    input_recipe_element jsonb;
BEGIN
    UPDATE products SET
        name = updated_product_data->>'name', 
        item_num = updated_product_data->>'item_num', 
        vendor_id = nullif(updated_product_data->>'vendor_id', '')::bigint, 
        weight_lbs = nullif(updated_product_data->>'weight_lbs', '')::integer, 
        box_type = updated_product_data->>'box_type', 
        box_cost = nullif(updated_product_data->>'box_cost', '')::numeric, 
        bag_size = updated_product_data->>'bag_size',
        bag_cost = nullif(updated_product_data->>'bag_cost', '')::numeric, 
        price_2021 = nullif(updated_product_data->>'price_2021', '')::numeric, 
        price_2022 = nullif(updated_product_data->>'price_2022', '')::numeric, 
        price_2023 = nullif(updated_product_data->>'price_2023', '')::numeric, 
        notes = updated_product_data->>'notes', 
        date_added = nullif(updated_product_data->>'date_added', '')::date, 
        upc = updated_product_data->>'upc', 
        fnsku = updated_product_data->>'fnsku', 
        asin = updated_product_data->>'asin', 
        do_we_carry = updated_product_data->>'do_we_carry', 
        process_time_per_unit_sec = nullif(updated_product_data->>'process_time_per_unit_sec', '')::integer, 
        meltable = updated_product_data->>'meltable', 
        map = nullif(updated_product_data->>'map', '')::numeric, 
        in_shipping_cost = nullif(updated_product_data->>'in_shipping_cost', '')::numeric, 
        out_shipping_cost = nullif(updated_product_data->>'out_shipping_cost', '')::numeric, 
        labor_cost = nullif(updated_product_data->>'labor_cost', '')::numeric, 
        item_cost = nullif(updated_product_data->>'item_cost', '')::numeric, 
        misc_cost = nullif(updated_product_data->>'misc_cost', '')::numeric, 
        amz_fees_cost = nullif(updated_product_data->>'amz_fees_cost', '')::numeric, 
        amz_fulfilment_cost = nullif(updated_product_data->>'amz_fulfilment_cost', '')::numeric, 
        storage_cost_30_day = nullif(updated_product_data->>'storage_cost_30_day', '')::numeric, 
        holiday_storage_cost = nullif(updated_product_data->>'holiday_storage_cost', '')::numeric, 
        total_cost = nullif(updated_product_data->>'total_cost', '')::numeric, 
        total_holiday_cost = nullif(updated_product_data->>'total_holiday_cost', '')::numeric, 
        default_units_per_case = nullif(updated_product_data->>'default_units_per_case', '')::integer, 
        status = updated_product_data->>'status', 
        unit_box_cost = nullif(updated_product_data->>'unit_box_cost', '')::numeric, 
        is_processed = (updated_product_data->>'is_processed')::boolean
    WHERE product_id = (updated_product_data->>'product_id')::bigint
    RETURNING * INTO updated_product;

    IF updated_recipe_data IS NOT NULL AND updated_product.is_processed IS TRUE THEN

        IF updated_product.fnsku IS NULL THEN
            recipe_label := updated_product.name;
        ELSE
            recipe_label := format('%s - %s', updated_product.name, updated_product.fnsku);
        END IF;

        recipe_id_value := (SELECT recipe_id FROM recipes WHERE output_product_id = updated_product.product_id LIMIT 1);

        current_recipe_label := (SELECT label FROM recipes WHERE recipe_id = recipe_id_value);

        -- Update the linked recipe label if it exists and is different from the new label
        IF current_recipe_label != recipe_label THEN
            UPDATE recipes SET label = recipe_label
            WHERE recipe_id = recipe_id_value;
        END IF;

        FOR input_recipe_element IN
            SELECT value
            FROM jsonb_array_elements(updated_recipe_data)
        LOOP
            IF NULLIF(input_recipe_element->>'recipe_id','')::bigint IS NOT NULL THEN
                -- Recipe element exists: update
                UPDATE recipe_elements SET 
                product_id = (input_recipe_element->>'product_id')::bigint, 
                qty = (input_recipe_element->>'qty')::integer 
                WHERE recipe_element_id = (input_recipe_element->>'recipe_element_id')::bigint; 
            ELSE
                -- RAISE EXCEPTION 'NEW RECIPE ELEMENT: %', input_recipe_element;
                -- Recipe element does not exist: add
                INSERT INTO recipe_elements (product_id, recipe_id, qty, type) VALUES (
                    (input_recipe_element->>'product_id')::bigint, -- Input Product
                    recipe_id_value, -- Linked Recipe Id
                    (input_recipe_element->>'qty')::integer, -- Element QTY
                    'input' -- Element Type
                );

            END IF;

        END LOOP;
        
    END IF;
END;
$function$


