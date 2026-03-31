SET check_function_bodies = false;
ALTER TYPE public.case_with_product_name ADD ATTRIBUTE recipe_id bigint;
ALTER TYPE public.case_with_product_name DROP ATTRIBUTE request_id;
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
            ELSE po.purchase_order_name ILIKE $2 OR coalesce(po.notes,'') ILIKE $2
          END);
  $q$;

EXECUTE v_sql USING in_filter_field, ('%' || in_filter_data || '%') INTO total_count;

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
END;$function$;
CREATE OR REPLACE FUNCTION public.batch_create_casesobj(cases_data jsonb)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  new_case cases;
  count integer;
  total_count integer;
  amount text;

BEGIN
  total_count := CAST(cases_data->>'amount' AS integer);
  
  FOR count in 1 .. total_count LOOP
    INSERT INTO cases (units_per_case, date_received, notes, product_id, location_id, status, purchase_order_id, request_id) 
    VALUES (
      CAST(cases_data->>'units_per_case' AS integer), -- Units per case
      CAST (cases_data->>'date_received' AS date), -- Date received
      cases_data->>'notes', -- Notes
      CAST (cases_data->>'product_id' AS bigint), -- Product ID
      CAST (cases_data->>'location_id' AS bigint), -- Location ID
      cases_data->>'status', -- Status
      CAST (cases_data->>'purchase_order_id' AS bigint), -- Purchase Order ID
      CAST (cases_data->>'request_id' AS bigint)  -- Request ID
    ) RETURNING * INTO new_case;
  END LOOP;
  RETURN 'Boxes/Cases created';
END;
$function$;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$function$;
CREATE OR REPLACE FUNCTION public.import_processed_product_keys_batch(record_array text[])
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  -- ARRAY VARIABLES
  -- These are all of the fields in the array, assigning them to actual variables will make them easier to track
  product_name text; 
  date_added timestamptz; 
  do_we_carry text; 
  vendor_name text; 
  fnsku text; 
  asin text;
  default_units_per_case integer; 
  weight_lbs integer; 
  box_type text; 
  box_cost numeric; 
  bag_size text;
  process_time_per_unit_sec integer; 
  meltable text; 
  products_needed_a text; 
  item_num_a text; 
  qty_1 numeric;
  price_1 numeric;
  products_needed_b text; 
  item_num_b text; 
  qty_2 numeric; 
  price_2 numeric;
  products_needed_c text; 
  item_num_c text; 
  qty_3 numeric; 
  price_3 numeric;
  products_needed_d text; 
  item_num_d text; 
  qty_4 numeric;
  price_4 numeric;
  products_needed_e text; 
  item_num_e text; 
  qty_5 numeric;
  price_5 numeric; 
  products_needed_f text; 
  item_num_f text; 
  qty_6 numeric; 
  price_6 numeric;
  bag_cost numeric; 
  in_shipping_cost numeric; 
  out_shipping_cost numeric;
  labor_cost numeric; 
  item_cost numeric; 
  unit_box_cost numeric; 
  misc_cost numeric; 
  amz_fees_cost numeric; 
  amz_fulfilment_cost numeric;
  storage_cost_30_day numeric; 
  holiday_storage_cost numeric; 
  total_cost numeric;
  total_holiday_cost numeric; 
  notes text;

  -- FUNCTION VARIABLES
  record text[];
  record_count integer;
  rowIdx integer := 1; 
  current_vendor_name text;
  current_vendor_id bigint;
  added_product_id bigint;
  recipe_label text;
  added_recipe_id bigint;
  product_a_id bigint;
  product_b_id bigint;
  product_c_id bigint;
  product_d_id bigint;
  product_e_id bigint;
  product_f_id bigint;
BEGIN
    RAISE LOG 'RECORD ARRAY!!!!: %', record_array;
    -- RAISE EXCEPTION 'RECORD ARRAY: %', record_array;
    -- Loop through each row in the 2D array
    --   RAISE EXCEPTION 'RECORD: %', record;
    FOREACH record SLICE 1 IN ARRAY record_array LOOP
        -- RAISE EXCEPTION 'RECORD ARRAY!!!!: %', record_array;
        RAISE LOG 'RECORD ARRAY ROW record: %', record;
        -- RAISE EXCEPTION 'ARRAY LENGTH: %', array_length(record_array, 1);
        -- RAISE EXCEPTION 'ROW INDEX: %', row_index;
        -- RAISE EXCEPTION 'RECORD ARRAY ROW %: %', row_index, record_array[1];

        -- record := record_array[row_index]; -- Assign the inner array to record

        -- RAISE EXCEPTION 'Record: %', record;
        -- RAISE EXCEPTION 'FIRST RECORD FIELD: %', record[1];

        -- Check if the record is NULL
        IF record IS NULL THEN
            RAISE EXCEPTION 'Record at index % is NULL', row_index;
        END IF;

        --Populate each array variable with the correct fields
        date_added := NULLIF(record[1], ''); 
        do_we_carry := record[2]; 
        product_name := record[3]; 
        vendor_name := record[4]; 
        fnsku := record[5]; 
        asin := record[6];
        default_units_per_case := NULLIF(record[7], '')::integer; 
        weight_lbs := NULLIF(record[8], '')::integer; 
        box_type := record[9]; 
        box_cost := NULLIF(record[10], '')::numeric; 
        bag_size := record[11];
        process_time_per_unit_sec := NULLIF(record[12], '')::integer; 
        meltable := record[13]; 
        products_needed_a := record[14]; 
        item_num_a := record[15]; 
        qty_1 := NULLIF(record[16], '')::numeric;
        price_1 := NULLIF(record[17], '')::numeric;
        products_needed_b := record[18]; 
        item_num_b := record[19]; 
        qty_2 := NULLIF(record[20], '')::numeric; 
        price_2 := NULLIF(record[21], '')::numeric;
        products_needed_c := record[22]; 
        item_num_c := record[23]; 
        qty_3 := NULLIF(record[24], '')::numeric; 
        price_3 := NULLIF(record[25], '')::numeric;
        products_needed_d := record[26]; 
        item_num_d := record[27]; 
        qty_4 := NULLIF(record[28], '')::numeric;
        price_4 := NULLIF(record[29], '')::numeric;
        products_needed_e := record[30]; 
        item_num_e := record[31]; 
        qty_5 := NULLIF(record[32], '')::numeric;
        price_5 := NULLIF(record[33], '')::numeric; 
        products_needed_f := record[34]; 
        item_num_f := record[35]; 
        qty_6 := NULLIF(record[36], '')::numeric; 
        price_6 := NULLIF(record[37], '')::numeric;
        bag_cost := NULLIF(record[38], '')::numeric; 
        in_shipping_cost := NULLIF(record[39], '')::numeric; 
        out_shipping_cost := NULLIF(record[40], '')::numeric;
        labor_cost := NULLIF(record[41], '')::numeric; 
        item_cost := NULLIF(record[42], '')::numeric; 
        unit_box_cost := NULLIF(record[43], '')::numeric; 
        misc_cost := NULLIF(record[44], '')::numeric; 
        amz_fees_cost := NULLIF(record[45], '')::numeric; 
        amz_fulfilment_cost := NULLIF(record[46], '')::numeric;
        storage_cost_30_day := NULLIF(record[47], '')::numeric; 
        holiday_storage_cost := NULLIF(record[48], '')::numeric; 
        total_cost := NULLIF(record[49], '')::numeric;
        total_holiday_cost := NULLIF(record[50], '')::numeric; 
        notes := record[51];
    
        -- Split the line into fields (assuming comma-separated values)
        current_vendor_name = vendor_name; -- Adjust index based on your CSV structure

        -- RAISE LOG 'vendor name: %', vendor_name;

        -- RAISE LOG 'QTY 1 of product %, %', product_name, qty_1;

        -- Check if vendor exists
        SELECT v.vendor_id INTO current_vendor_id FROM vendors v WHERE LOWER(v.vendor_name) = LOWER(current_vendor_name);

        -- If vendor does not exist, insert it
        IF current_vendor_id IS NULL THEN
            INSERT INTO vendors (vendor_name) VALUES (current_vendor_name) RETURNING vendor_id INTO current_vendor_id;
        END IF;

        -- Validate required fields before inserting
        IF product_name IS NULL THEN
            RAISE EXCEPTION 'Required fields are missing: product_name: %', product_name;
            RETURN 'Task Failed'; -- Skip this iteration if required fields are missing
        END IF;

        IF current_vendor_id IS NULL THEN
            RAISE EXCEPTION 'Required fields are missing for product %: current_vendor_id: %', product_name, current_vendor_id;
            RETURN 'Task Failed'; -- Skip this iteration if required fields are missing
        END IF;

        IF products_needed_a IS NULL THEN 
            -- RAISE EXCEPTION 'Product % requires at least one input recipe ingredient: products_needed_a: %', product_name, products_needed_a;
            -- RETURN 'Task Failed';

            -- GET RID OF AFTER FIRST IMPORT-----------------------------------------------------------------------------
            RAISE LOG 'ERROR: Product % requires at least one input recipe ingredient: products_needed_a: %', product_name, products_needed_a;
            CONTINUE;
            -------------------------------------------------------------------------------------------------------------
        END IF;

        -- GET RID OF THIS EVENTUALLY, ONLY FOR INITIAL IMPORT------------------------------------
        IF qty_1 IS NULL THEN 
            RAISE LOG 'Product % input recipe ingredient requres a quantity: qty_1: %', product_name, qty_1;
            CONTINUE;
        END IF;
        ------------------------------------------------------------------------------------------

        IF products_needed_a IS NOT NULL AND qty_1 IS NOT NULL THEN 
            RAISE LOG 'Product: %; Product needed A: %; qty 1: %', product_name, products_needed_a, qty_1;
            SELECT product_id INTO product_a_id FROM products WHERE LOWER(name) = LOWER(products_needed_a);
        END IF;

        IF product_a_id IS NULL THEN 
            -- RAISE EXCEPTION 'Product % requires at least one input recipe ingredient: products_needed_a: %', product_name, products_needed_a;
            -- RETURN 'Task Failed';

             -- GET RID OF AFTER FIRST IMPORT-----------------------------------------------------------------------------
            RAISE LOG 'ERROR: Product % requires at least one input recipe ingredient: products_needed_a: %', product_name, products_needed_a;
            CONTINUE;
            -------------------------------------------------------------------------------------------------------------
        END IF;

        IF products_needed_b IS NOT NULL AND qty_2 IS NOT NULL THEN
            RAISE LOG 'Product: %; Product needed B %; qty 2: %', product_name, products_needed_b, qty_2; 
            SELECT product_id INTO product_b_id FROM products WHERE LOWER(name) = LOWER(products_needed_b);
        END IF;

        IF products_needed_c IS NOT NULL AND qty_3 IS NOT NULL THEN 
            RAISE LOG 'Product: %; Product needed C: %; qty 3: %', product_name, products_needed_c, qty_3;
            SELECT product_id INTO product_c_id FROM products WHERE LOWER(name) = LOWER(products_needed_c);
        END IF;

        IF products_needed_d IS NOT NULL AND qty_4 IS NOT NULL THEN 
            RAISE LOG 'Product: %; Product needed D: %; qty 4: %', product_name, products_needed_d, qty_4;
            SELECT product_id INTO product_d_id FROM products WHERE LOWER(name) = LOWER(products_needed_d);
        END IF;

        IF products_needed_e IS NOT NULL AND qty_5 IS NOT NULL THEN 
            RAISE LOG 'Product: %; Product needed E: %; qty 5: %', product_name, products_needed_e, qty_5;
            SELECT product_id INTO product_e_id FROM products WHERE LOWER(name) = LOWER(products_needed_e);
        END IF;

        IF products_needed_f IS NOT NULL AND qty_6 IS NOT NULL THEN
            RAISE LOG 'Product: %; Product needed F: %; qty 6: %', product_name, products_needed_f, qty_6; 
            SELECT product_id INTO product_f_id FROM products WHERE LOWER(name) = LOWER(products_needed_f);
        END IF;

        -- Insert the product record (adjust the fields as necessary)
        INSERT INTO products (name, date_added, do_we_carry, vendor_id, fnsku, asin, default_units_per_case, weight_lbs, box_type, box_cost, process_time_per_unit_sec, 
        meltable, bag_cost, in_shipping_cost, out_shipping_cost, labor_cost, item_cost, unit_box_cost, misc_cost, amz_fees_cost, storage_cost_30_day, holiday_storage_cost, total_cost,
        total_holiday_cost, notes) VALUES (
            product_name, -- Product name
            date_added, -- Item number
            do_we_carry, -- Product UPC
            current_vendor_id,
            fnsku, 
            asin, 
            default_units_per_case, 
            weight_lbs, box_type, 
            box_cost, 
            process_time_per_unit_sec, 
            meltable, 
            bag_cost, 
            in_shipping_cost, 
            out_shipping_cost, 
            labor_cost, item_cost, 
            unit_box_cost, misc_cost, 
            amz_fees_cost, 
            storage_cost_30_day, 
            holiday_storage_cost, 
            total_cost,
            total_holiday_cost, 
            notes -- Product key notes
        ) RETURNING product_id INTO added_product_id;

        -- Create recipe based on the products required fields
        recipe_label = format('%s - %s', product_name, fnsku);

        INSERT INTO recipes (label, vendor_id) VALUES (recipe_label, current_vendor_id) RETURNING recipe_id INTO added_recipe_id;

        -- Create a recipe element for the processed product output and however many input elements there are
        INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, added_product_id, 'output', 1);

        RAISE LOG 'QTY 1 of product % near the product inserts, %', recipe_label, qty_1;

        IF product_a_id IS NOT NULL AND qty_1 IS NOT NULL THEN
            RAISE LOG 'IN PRODUCT ID; Product: %; Product needed A: %; qty 1: %', product_name, products_needed_a, qty_1;
            INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_a_id, 'input', qty_1);
        END IF;

        IF product_b_id IS NOT NULL AND qty_2 IS NOT NULL THEN
            RAISE LOG 'IN PRODUCT ID; Product: %; Product needed B %; qty 2: %', product_name, products_needed_b, qty_2; 
            INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_b_id, 'input', qty_2);
        END IF;

        IF product_c_id IS NOT NULL AND qty_3 IS NOT NULL THEN
            RAISE LOG 'IN PRODUCT ID; Product: %; Product needed C: %; qty 3: %', product_name, products_needed_c, qty_3;
            INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_c_id, 'input', qty_3);
        END IF;

        IF product_d_id IS NOT NULL AND qty_4 IS NOT NULL THEN
            RAISE LOG 'IN PRODUCT ID; Product: %; Product needed D: %; qty 4: %', product_name, products_needed_d, qty_4;
            INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_d_id, 'input', qty_4);
        END IF;

        IF product_e_id IS NOT NULL AND qty_5 IS NOT NULL THEN
            RAISE LOG 'IN PRODUCT ID; Product: %; Product needed E: %; qty 5: %', product_name, products_needed_e, qty_5;
            INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_e_id, 'input', qty_5);
        END IF;

        IF product_f_id IS NOT NULL AND qty_6 IS NOT NULL THEN
            RAISE LOG 'IN PRODUCT ID; Product: %; Product needed F: %; qty 6: %', product_name, products_needed_f, qty_6; 
            INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_f_id, 'input', qty_6);
        END IF;

        record_count := record_count + 1;
    END LOOP;
    
    RETURN 'Record(s) Imported';
    -- RETURN 'A total of % record(s) imported', record_count;
END;
$function$;
CREATE OR REPLACE FUNCTION public.import_processed_product_keys(product_name text, date_added timestamp with time zone, do_we_carry text, vendor_name text, fnsku text, asin text, default_units_per_case integer, weight_lbs integer, box_type text, box_cost numeric, process_time_per_unit_sec integer, meltable text, products_needed_a text, item_num_a text, qty_1 integer, products_needed_b text, item_num_b text, qty_2 integer, products_needed_c text, item_num_c text, qty_3 integer, products_needed_d text, item_num_d text, qty_4 integer, products_needed_e text, item_num_e text, qty_5 integer, products_needed_f text, item_num_f text, qty_6 integer, bag_cost numeric, in_shipping_cost numeric, out_shipping_cost numeric, labor_cost numeric, item_cost numeric, unit_box_cost numeric, misc_cost numeric, amz_fees_cost numeric, storage_cost_30_day numeric, holiday_storage_cost numeric, total_cost numeric, total_holiday_cost numeric, notes text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    current_vendor_name text;
    current_vendor_id bigint;
    added_product_id bigint;
    recipe_label text;
    added_recipe_id bigint;
    product_a_id bigint;
    product_b_id bigint;
    product_c_id bigint;
    product_d_id bigint;
    product_e_id bigint;
    product_f_id bigint;
BEGIN
    -- Split the line into fields (assuming comma-separated values)
    current_vendor_name = vendor_name; -- Adjust index based on your CSV structure

    RAISE LOG 'vendor name: %', vendor_name;

    -- Check if vendor exists
    SELECT v.vendor_id INTO current_vendor_id FROM vendors v WHERE LOWER(v.vendor_name) = LOWER(current_vendor_name);

    -- If vendor does not exist, insert it
    IF current_vendor_id IS NULL THEN
        INSERT INTO vendors (vendor_name) VALUES (current_vendor_name) RETURNING vendor_id INTO current_vendor_id;
    END IF;

    -- Validate required fields before inserting
    IF product_name IS NULL THEN
        RAISE EXCEPTION 'Required fields are missing: product_name: %', product_name;
        RETURN; -- Skip this iteration if required fields are missing
    END IF;

    IF current_vendor_id IS NULL THEN
        RAISE EXCEPTION 'Required fields are missing for product %: current_vendor_id: %', product_name, current_vendor_id;
        RETURN; -- Skip this iteration if required fields are missing
    END IF;

    IF products_needed_a IS NULL THEN 
        RAISE EXCEPTION 'Product % requires at least one input recipe ingredient: products_needed_a: %', product_name, products_needed_a;
        RETURN;
    END IF;

    IF products_needed_a IS NOT NULL AND qty_1 IS NOT NULL THEN 
        SELECT product_id INTO product_a_id FROM product WHERE LOWER(name) = LOWER(products_needed_a);
    END IF;

    IF product_a_id IS NULL THEN 
        RAISE EXCEPTION 'Product % requires at least one input recipe ingredient: products_needed_a: %', product_name, products_needed_a;
        RETURN;
    END IF;

    IF products_needed_b IS NOT NULL AND qty_2 IS NOT NULL THEN 
        SELECT product_id INTO product_b_id FROM product WHERE LOWER(name) = LOWER(products_needed_b);
    END IF;

    IF products_needed_c IS NOT NULL AND qty_3 IS NOT NULL THEN 
        SELECT product_id INTO product_c_id FROM product WHERE LOWER(name) = LOWER(products_needed_c);
    END IF;

    IF products_needed_d IS NOT NULL AND qty_4 IS NOT NULL THEN 
        SELECT product_id INTO product_d_id FROM product WHERE LOWER(name) = LOWER(products_needed_d);
    END IF;

    IF products_needed_e IS NOT NULL AND qty_5 IS NOT NULL THEN 
        SELECT product_id INTO product_e_id FROM product WHERE LOWER(name) = LOWER(products_needed_e);
    END IF;

    IF products_needed_f IS NOT NULL AND qty_6 IS NOT NULL THEN 
        SELECT product_id INTO product_f_id FROM product WHERE LOWER(name) = LOWER(products_needed_f);
    END IF;

    -- Insert the product record (adjust the fields as necessary)
    INSERT INTO products (name, date_added, do_we_carry, vendor_id, fnsku, asin, default_units_per_case, weight_lbs, box_type, box_cost, process_time_per_unit_sec, 
    meltable, bag_cost, in_shipping_cost, out_shipping_cost, labor_cost, item_cost, unit_box_cost, misc_cost, amz_fees_cost, storage_cost_30_day, holiday_storage_cost, total_cost,
    total_holiday_cost, notes) VALUES (
        product_name, -- Product name
        date_added, -- Item number
        do_we_carry, -- Product UPC
        current_vendor_id,
        fnsku, 
        asin, 
        default_units_per_case, 
        weight_lbs, box_type, 
        box_cost, 
        process_time_per_unit_sec, 
        meltable, 
        bag_cost, 
        in_shipping_cost, 
        out_shipping_cost, 
        labor_cost, item_cost, 
        unit_box_cost, misc_cost, 
        amz_fees_cost, 
        storage_cost_30_day, 
        holiday_storage_cost, 
        total_cost,
        total_holiday_cost, 
        notes -- Product key notes
    ) RETURNING product_id INTO added_product_id;

    -- Create recipe based on the products required fields
    recipe_label = format('%s - %s', product_name, fnsku);

    INSERT INTO recipes (label, vendor_id) VALUES (recipe_label, current_vendor_id) RETURNING recipe_id INTO added_recipe_id;

    -- Create a recipe element for the processed product output and however many input elements there are
    INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, added_product_id, 'output', 1);

    IF product_a_id IS NOT NULL THEN
        INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_a_id, 'input', qty_1);
    END IF;

    IF product_b_id IS NOT NULL THEN
        INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_b_id, 'input', qty_2);
    END IF;

    IF product_c_id IS NOT NULL THEN
        INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_c_id, 'input', qty_3);
    END IF;

    IF product_d_id IS NOT NULL THEN
        INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_d_id, 'input', qty_4);
    END IF;

    IF product_e_id IS NOT NULL THEN
        INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_e_id, 'input', qty_5);
    END IF;

    IF product_f_id IS NOT NULL THEN
        INSERT INTO recipe_elements (recipe_id, product_id, type, qty) VALUES (added_recipe_id, product_f_id, 'input', qty_6);
    END IF;

END;
$function$;
CREATE OR REPLACE FUNCTION public.update_request(record_array text[])
 RETURNS public.requests_to_process
 LANGUAGE plpgsql
AS $function$
DECLARE
  updated_request requests_to_process;

BEGIN
  UPDATE requests_to_process
  SET
    product_id = record_array[1]::bigint, -- Product ID
    purchase_order_id = record_array[2]::bigint, -- Purchase Order ID
    notes = record_array[3], -- Notes
    status = record_array[4], -- Status
    labels_printed = record_array[5]::boolean, -- Labels printed?
    ship_label = record_array[6]::boolean, -- Shipping labels printed?
    priority = record_array[7], -- Priority
    ship_to_amz = record_array[8]::integer, -- Ship to Amazon
    deadline = record_array[9]::timestamptz, -- Deadline
    warehouse_qty = record_array[10]::integer -- Store in warehouse
  WHERE request_id = record_array[11]::bigint
  RETURNING * INTO updated_request;

  RETURN updated_request;
END;
$function$;
