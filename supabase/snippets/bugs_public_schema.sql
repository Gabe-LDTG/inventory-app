


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."case_with_product_name" AS (
	"case_id" bigint,
	"units_per_case" integer,
	"date_received" "date",
	"notes" "text",
	"product_id" bigint,
	"location_id" bigint,
	"status" "text",
	"purchase_order_id" bigint,
	"recipe_id" bigint,
	"product_name" "text"
);


ALTER TYPE "public"."case_with_product_name" OWNER TO "postgres";


CREATE TYPE "public"."processed_product_input" AS (
	"date_added" timestamp with time zone,
	"do_we_carry" "text",
	"name" "text",
	"vendor" "text",
	"fnsku" "text",
	"asin" "text",
	"default_units_per_case" integer,
	"weight_lbs" integer,
	"box_type" "text",
	"box_cost" numeric,
	"bag_size" "text",
	"process_time_per_unit_sec" integer,
	"meltable" "text",
	"products_needed_a" "text",
	"item_num_1" "text",
	"qty_1" integer,
	"price_1" numeric,
	"products_needed_b" "text",
	"item_num_2" "text",
	"qty_2" integer,
	"price_2" numeric,
	"products_needed_c" "text",
	"item_num_3" "text",
	"qty_3" integer,
	"price_3" numeric,
	"products_needed_d" "text",
	"item_num_4" "text",
	"qty_4" integer,
	"price_4" numeric,
	"products_needed_e" "text",
	"item_num_5" "text",
	"qty_5" integer,
	"price_5" numeric,
	"products_needed_f" "text",
	"item_num_6" "text",
	"qty_6" integer,
	"price_6" numeric,
	"bag_cost" numeric,
	"in_shipping_cost" numeric,
	"out_shipping_cost" numeric,
	"labor_cost" numeric,
	"item_cost" numeric,
	"unit_box_cost" numeric,
	"misc_cost" numeric,
	"amz_fees_cost" numeric,
	"amz_fulfilment_cost" numeric,
	"storage_cost_30_day" numeric,
	"holiday_storage_cost" numeric,
	"total_cost" numeric,
	"total_holiday_cost" numeric,
	"notes" "text"
);


ALTER TYPE "public"."processed_product_input" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "product_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "item_num" "text",
    "vendor_id" integer NOT NULL,
    "weight_lbs" integer,
    "box_type" "text",
    "box_cost" numeric(6,2) DEFAULT NULL::numeric,
    "bag_size" "text",
    "bag_cost" numeric(6,2) DEFAULT NULL::numeric,
    "price_2021" numeric(6,2) DEFAULT NULL::numeric,
    "price_2022" numeric(6,2) DEFAULT NULL::numeric,
    "price_2023" numeric(6,2) DEFAULT NULL::numeric,
    "notes" "text",
    "date_added" timestamp with time zone,
    "upc" "text",
    "fnsku" "text",
    "asin" "text",
    "do_we_carry" "text",
    "process_time_per_unit_sec" integer,
    "meltable" "text",
    "map" numeric(6,2) DEFAULT NULL::numeric,
    "in_shipping_cost" numeric(6,2) DEFAULT NULL::numeric,
    "out_shipping_cost" numeric(6,2) DEFAULT NULL::numeric,
    "labor_cost" numeric(6,2) DEFAULT NULL::numeric,
    "item_cost" numeric(6,2) DEFAULT NULL::numeric,
    "misc_cost" numeric(6,2) DEFAULT NULL::numeric,
    "amz_fees_cost" numeric(6,2) DEFAULT NULL::numeric,
    "amz_fulfilment_cost" numeric(6,2) DEFAULT NULL::numeric,
    "storage_cost_30_day" numeric(6,2) DEFAULT NULL::numeric,
    "holiday_storage_cost" numeric(6,2) DEFAULT NULL::numeric,
    "total_cost" numeric(6,2) DEFAULT NULL::numeric,
    "total_holiday_cost" numeric(6,2) DEFAULT NULL::numeric,
    "default_units_per_case" integer,
    "status" "text",
    "unit_box_cost" numeric(6,2) DEFAULT NULL::numeric,
    "is_processed" boolean
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_add_product_common_text"("product_data" "text"[]) RETURNS "public"."products"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_product products;

BEGIN
  -- RAISE EXCEPTION 'record: %', product_record;

  INSERT INTO products (name, item_num, vendor_id, weight_lbs, box_type, box_cost, bag_size, bag_cost, price_2021, price_2022, price_2023, notes, date_added, upc, fnsku, asin, do_we_carry, process_time_per_unit_sec, meltable, map, in_shipping_cost,
  out_shipping_cost, labor_cost, item_cost, misc_cost, amz_fees_cost, amz_fulfilment_cost, storage_cost_30_day, holiday_storage_cost, total_cost, total_holiday_cost, default_units_per_case, status, unit_box_cost) VALUES (
            product_data[1], -- Product Name 
            product_data[2], -- Item Number 
            product_data[3]::bigint, -- Vendor Id 
            product_data[4]::integer, -- Weight (lbs)
            product_data[5], -- Box Type
            product_data[6]::numeric, -- Box Cost
            product_data[7], -- Bag Size
            product_data[8]::numeric, -- Bag Cost
            product_data[9]::numeric, -- Price 2021 
            product_data[10]::numeric, -- Price 2022
            product_data[11]::numeric, -- Price 2023  
            product_data[12], -- Notes 
            product_data[13]::timestamptz, -- Date Added
            product_data[14], -- UPC
            product_data[15], -- FNSKU
            product_data[16], -- ASIN
            product_data[17], -- Do We Carry?
            product_data[18]::integer, -- Process Time (Per Unit Second)
            product_data[19], -- Meltable?
            product_data[20]::numeric, -- MAP
            product_data[21]::numeric, -- In Shipping Cost
            product_data[22]::numeric, -- Out Shipping Cost
            product_data[23]::numeric, -- Labor Cost
            product_data[24]::numeric, -- Item Cost
            product_data[25]::numeric, -- Misc Cost
            product_data[26]::numeric, -- Amazon Fees Cost
            product_data[27]::numeric, -- Amazon Fulfilment Cost
            product_data[28]::numeric, -- 30 Day Storage Cost
            product_data[29]::numeric, -- Holiday Storage Cost
            product_data[30]::numeric, -- Total Cost
            product_data[31]::numeric, -- Total Holiday Cost
            product_data[32]::integer, -- Default Units per Case
            product_data[33], -- Status
            product_data[34]::numeric -- Unit Box Cost
            
        ) RETURNING * INTO new_product;

  RETURN new_product;
END;
$$;


ALTER FUNCTION "public"."_add_product_common_text"("product_data" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_edit_product_common_text"("product_record" "text"[]) RETURNS "public"."products"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_product products;

BEGIN
    -- RAISE EXCEPTION 'record: %', product_record;

  UPDATE products SET 
    name = product_record[2], 
    item_num = product_record[3], 
    vendor_id = product_record[4]::bigint, 
    weight_lbs = product_record[5]::integer, 
    box_type = product_record[6], 
    box_cost = product_record[7]::numeric, 
    bag_size = product_record[8], 
    bag_cost = product_record[9]::numeric, 
    price_2021 = product_record[10]::numeric, 
    price_2022 = product_record[11]::numeric, 
    price_2023 = product_record[12]::numeric, 
    notes = product_record[13], 
    date_added = product_record[14]::timestamptz, 
    upc = product_record[15], 
    fnsku = product_record[16], 
    asin = product_record[17], 
    do_we_carry = product_record[18], 
    process_time_per_unit_sec = product_record[19]::integer, 
    meltable = product_record[20], 
    map = product_record[21]::numeric, 
    in_shipping_cost = product_record[22]::numeric,
    out_shipping_cost = product_record[23]::numeric, 
    labor_cost = product_record[24]::numeric, 
    item_cost = product_record[25]::numeric, 
    misc_cost = product_record[26]::numeric, 
    amz_fees_cost = product_record[27]::numeric, 
    amz_fulfilment_cost = product_record[28]::numeric, 
    storage_cost_30_day = product_record[29]::numeric, 
    holiday_storage_cost = product_record[30]::numeric, 
    total_cost = product_record[31]::numeric, 
    total_holiday_cost = product_record[32]::numeric, 
    default_units_per_case = product_record[33]::integer, 
    status = product_record[34], 
    unit_box_cost = product_record[35]::numeric
     WHERE product_id = product_record[1]::bigint RETURNING * INTO updated_product;

  RETURN updated_product;
END;
$$;


ALTER FUNCTION "public"."_edit_product_common_text"("product_record" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_get_purchase_order_ids_helper"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) RETURNS TABLE("total_count" bigint, "po_ids" bigint[])
    LANGUAGE "plpgsql" STABLE
    AS $_$DECLARE
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
END;$_$;


ALTER FUNCTION "public"."_get_purchase_order_ids_helper"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_foreign_keys_and_indexes"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    table_rec RECORD;
BEGIN
    -- Loop through each table in the public schema
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        -- Example for adding foreign key constraints based on table names
        IF table_rec.table_name = 'cases' THEN
            EXECUTE format('ALTER TABLE public.cases ADD CONSTRAINT fk_product_id FOREIGN KEY (product_id) REFERENCES products(product_id);');
            EXECUTE format('ALTER TABLE public.cases ADD CONSTRAINT fk_purchase_order_id FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(purchase_order_id);');
        ELSIF table_rec.table_name = 'requests_to_process' THEN
            EXECUTE format('ALTER TABLE public.requests_to_process ADD CONSTRAINT fk_vendor_id FOREIGN KEY (vendor_id) REFERENCES vendors(vendor_id);');
            -- Add more foreign keys as needed
        ELSIF table_rec.table_name = 'products' THEN
            EXECUTE format('ALTER TABLE public.products ADD CONSTRAINT fk_category_id FOREIGN KEY (category_id) REFERENCES categories(category_id);');
            -- Add more foreign keys as needed
        END IF;

        -- Example for adding an index on a specific column
        -- EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_product_id ON public.%I (product_id);', table_rec.table_name, table_rec.table_name);
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."add_foreign_keys_and_indexes"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "location_id" bigint NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_location"("location_record" "text"[]) RETURNS "public"."locations"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_location locations;

BEGIN
  INSERT INTO locations (name) VALUES (location_record[1]) RETURNING * INTO new_location;

  RETURN new_location;
END;
$$;


ALTER FUNCTION "public"."add_location"("location_record" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) RETURNS "public"."products"
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
  new_processed_product products;
  recipe_label text;
  new_recipe recipes;
  input_recipe_element text[];

BEGIN 
  SELECT * FROM _add_product_common_text(product_record) INTO new_processed_product;

  -- RAISE EXCEPTION 'New Product: %', new_processed_product;

  recipe_label := format('%s - %s', new_processed_product.name, new_processed_product.fnsku);

  -- RAISE EXCEPTION 'Recipe label: %', recipe_label;

  -- Create the recipe 
  INSERT INTO recipes (label, vendor_id) VALUES (
    recipe_label, new_processed_product.vendor_id) RETURNING * INTO new_recipe;

  -- Create the output element
  INSERT INTO recipe_elements (product_id, recipe_id, qty, type) VALUES (
    new_processed_product.product_id,
    new_recipe.recipe_id,
    1,
    'output'
  );

  -- RAISE EXCEPTION 'Output element insert complete';

  -- Loop through the recipe array and create the input element(s)
  FOREACH input_recipe_element SLICE 1 IN ARRAY recipe_array LOOP
    INSERT INTO recipe_elements (product_id, recipe_id, qty, type) VALUES (
      input_recipe_element[1]::bigint, -- Input Product
      new_recipe.recipe_id, -- Linked Recipe Id
      input_recipe_element[2]::integer, -- Element QTY
      'input' -- Element Type
    );
  END LOOP;

  RETURN new_processed_product;
END;
$$;


ALTER FUNCTION "public"."add_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_raw_product_composite"("product_record" "public"."products") RETURNS "public"."products"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
new_product products;

BEGIN
  INSERT INTO products (name, item_num, upc, vendor_id, price_2023, price_2022, price_2021, 
        default_units_per_case, map, notes) VALUES (
            product_record.name, 
            product_record.item_number, 
            product_record.product_upc, 
            product_record.vendor_id,
            product_record.the_2023_price, 
            product_record.the_2022_price,
            product_record.the_2021_price, 
            product_record.default_units_per_case, 
            product_record.map_cost, 
            product_record.product_notes 
        ) RETURNING * INTO new_product;

  RETURN new_product;
END;
$$;


ALTER FUNCTION "public"."add_raw_product_composite"("product_record" "public"."products") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_raw_product_text"("product_record" "text"[]) RETURNS "public"."products"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_raw_product products;

BEGIN
  -- RAISE EXCEPTION 'record: %', product_record;

  SELECT * FROM _add_product_common_text(product_record) INTO new_raw_product;

  RETURN new_raw_product;
END;
$$;


ALTER FUNCTION "public"."add_raw_product_text"("product_record" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bad_print"("data_array" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN 
RAISE NOTICE 'DATA: %', data_array;
END;$$;


ALTER FUNCTION "public"."bad_print"("data_array" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_create_cases"("record_array" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_case cases;
  count integer;
  total_count integer;

BEGIN
  total_count := record_array[8]::integer; -- Amount

  FOR count in 1 .. total_count LOOP
    INSERT INTO cases (units_per_case, date_received, notes, product_id, location_id, status, purchase_order_id, request_id) 
    VALUES (
      record_array[1]::integer, -- Units per case
      record_array[2]::date, -- Date received
      record_array[3], -- Notes
      record_array[4]::bigint, -- Product ID
      record_array[5]::bigint, -- Location ID
      record_array[6], -- Status
      record_array[7]::bigint, -- Purchase Order ID
      record_array[9]::bigint  -- Request ID
    ) RETURNING * INTO new_case;
  END LOOP;
  RETURN 'Boxes/Cases created';
END;
$$;


ALTER FUNCTION "public"."batch_create_cases"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_create_casesobj"("cases_data" "jsonb") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."batch_create_casesobj"("cases_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_delete_products_by_id"("id_array" bigint[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  id_line bigint;
BEGIN
  FOREACH id_line IN ARRAY id_array LOOP
    DELETE FROM products WHERE product_id = id_line;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."batch_delete_products_by_id"("id_array" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_create_cases"("record_array" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_case cases;
  record text[];

BEGIN

  FOREACH record SLICE 1 IN ARRAY record_array 
  LOOP
    INSERT INTO cases (units_per_case, date_received, notes, product_id, location_id, status, purchase_order_id, request_id) VALUES (
      record[1]::integer, -- Units per case
      record[2]::date, -- Date received
      record[3], -- Notes
      record[4]::bigint, -- Product ID
      record[5]::bigint, -- Location ID
      record[6], -- Status
      record[7]::bigint, -- Purchase Order ID
      record_array[8]::bigint  -- Request ID
    );
  END LOOP;
  RETURN 'Boxes/Cases created';
END;
$$;


ALTER FUNCTION "public"."bulk_create_cases"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_create_po_recipe"("record_array" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  record text[];

BEGIN
  FOREACH record SLICE 1 IN ARRAY record_array 
  LOOP
    INSERT INTO po_recipes (purchase_order_id, recipe_id, qty) VALUES (
      record[1]::bigint, -- Purchase Order ID
      record[2]::bigint, -- Recipe ID
      record[3]::integer -- Recipe qty
    );
  END LOOP;

  RETURN 'PO Recipes Created';
END;
$$;


ALTER FUNCTION "public"."bulk_create_po_recipe"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_delete_cases"("id_array" bigint[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  id_line bigint;

BEGIN
  FOREACH id_line IN ARRAY id_array LOOP
    DELETE FROM cases WHERE case_id = id_line;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."bulk_delete_cases"("id_array" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_update_case"("record_array" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_case cases;
  record text[];

BEGIN
  FOREACH record SLICE 1 IN ARRAY record_array 
  LOOP
    UPDATE cases SET 
      units_per_case = record[1]::integer, 
      date_received = record[2]::date, 
      notes = record[3], 
      product_id = record[4]::bigint, 
      location_id = record[5]::bigint, 
      status = record[6],
      purchase_order_id = record[7]::bigint,
      request_id = record[8]::bigint
    WHERE case_id = record[9]::bigint;
  END LOOP;

  RETURN 'Boxes/Cases Updated';
END;
$$;


ALTER FUNCTION "public"."bulk_update_case"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_update_case_v2"("case_array" "jsonb") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_rows_updated integer := 0;
BEGIN
  IF case_array IS NULL OR jsonb_typeof(case_array) <> 'array' THEN
    RAISE EXCEPTION 'case_array must be a JSON array of objects';
  END IF;

  UPDATE cases c
  SET
    units_per_case    = r.units_per_case,
    date_received     = r.date_received,
    notes             = r.notes,
    product_id        = r.product_id,
    location_id       = r.location_id,
    status            = r.status,
    purchase_order_id = r.purchase_order_id,
    request_id        = r.request_id
  FROM jsonb_to_recordset(case_array) AS r(
    case_id bigint,
    units_per_case integer,
    date_received date,
    notes text,
    product_id bigint,
    location_id bigint,
    status text,
    purchase_order_id bigint,
    request_id bigint
  )
  WHERE c.case_id = r.case_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  RETURN format('Boxes/Cases Updated (%s row(s))', v_rows_updated);
END;
$$;


ALTER FUNCTION "public"."bulk_update_case_v2"("case_array" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cases" (
    "case_id" bigint NOT NULL,
    "units_per_case" integer NOT NULL,
    "date_received" "date",
    "notes" "text",
    "product_id" bigint,
    "location_id" bigint,
    "status" "text",
    "purchase_order_id" bigint,
    "request_id" bigint,
    "picklist_element_id" bigint,
    "invoice_id" bigint
);


ALTER TABLE "public"."cases" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_case"("record_array" "text"[]) RETURNS "public"."cases"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_case cases;

BEGIN
  INSERT INTO cases (units_per_case, date_received, notes, product_id, location_id, status, purchase_order_id, request_id) VALUES 
  (
    record_array[1]::integer, -- Units per case
    record_array[2]::date, -- Date received
    record_array[3], -- Notes
    record_array[4]::bigint, -- Product ID
    record_array[5]::bigint, -- Location ID
    record_array[6], -- Status
    record_array[7]::bigint, -- Purchase Order ID
    record_array[8]::bigint  -- Request ID
  ) RETURNING * INTO new_case;

  RETURN new_case;
END;
$$;


ALTER FUNCTION "public"."create_case"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_picklist"("picklist_data" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $_$
DECLARE
  new_picklist picklists;
  picklist_element JSONB;

BEGIN
  INSERT INTO picklists (label, status) 
  VALUES (
    picklist_data->>'label',
    'Not Picked'
  )
  RETURNING * INTO new_picklist;

  IF new_picklist.picklist_id IS NULL THEN 
    RAISE EXCEPTION 'Error creating picklist record';
  END IF;

  -- RAISE EXCEPTION 'Exception marker 1';

  FOR picklist_element IN SELECT * FROM jsonb_array_elements(picklist_data->'picklistElements') LOOP
    DECLARE
      new_picklist_element picklist_elements;
      linked_case_id bigint;
      request_id_value text;

    BEGIN
      -- RAISE EXCEPTION 'Exception marker 2';
      request_id_value := picklist_element->>'request_id';  -- Get the request_id as text

      -- RAISE EXCEPTION 'Picklist element request id: %', request_id_value;
      UPDATE requests_to_process
      SET picklist_id = new_picklist.picklist_id
      WHERE request_id = request_id_value::bigint;

      -- Check if request_id_value is a valid bigint
      IF request_id_value IS NULL OR request_id_value = '' OR NOT request_id_value ~ '^\d+$' THEN
        RAISE EXCEPTION 'Invalid request_id: %', request_id_value;
      END IF;

      -- RAISE EXCEPTION 'Picklist element data: %', picklist_element;

      INSERT INTO picklist_elements (picklist_id, notes, request_id, lane_location)
      VALUES (
        new_picklist.picklist_id,
        picklist_element->>'notes',
        request_id_value::bigint,
        picklist_element->>'lane_location'
      ) RETURNING * INTO new_picklist_element;

      -- RAISE EXCEPTION 'Exception marker 3';

      FOR linked_case_id IN SELECT * FROM jsonb_array_elements(picklist_element->'usedCaseIds') LOOP
        BEGIN
          UPDATE cases
          SET picklist_element_id = new_picklist_element.picklist_element_id
          WHERE case_id = linked_case_id::bigint;
        END;
      END LOOP;
    END;
  END LOOP;

END;
$_$;


ALTER FUNCTION "public"."create_picklist"("picklist_data" "jsonb") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."po_recipes" (
    "po_recipe_id" bigint NOT NULL,
    "purchase_order_id" bigint NOT NULL,
    "recipe_id" bigint NOT NULL,
    "qty" integer NOT NULL
);


ALTER TABLE "public"."po_recipes" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_po_recipe"("record_array" "text"[]) RETURNS "public"."po_recipes"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_po_recipe po_recipes;

BEGIN
  INSERT INTO po_recipes (purchase_order_id, recipe_id, qty) VALUES (
    record_array[1]::bigint, -- Purchase Order ID
    record_array[2]::bigint, -- Recipe ID
    record_array[3]::integer -- Recipe qty
  ) RETURNING * INTO new_po_recipe;

  RETURN new_po_recipe;
END;
$$;


ALTER FUNCTION "public"."create_po_recipe"("record_array" "text"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "purchase_order_id" bigint NOT NULL,
    "purchase_order_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "date_ordered" timestamp with time zone,
    "date_received" timestamp with time zone,
    "vendor_id" bigint NOT NULL,
    "discount" integer
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_purchase_order"("record_array" "text"[]) RETURNS "public"."purchase_orders"
    LANGUAGE "plpgsql"
    AS $$ 
DECLARE
  new_purchase_order purchase_orders;

BEGIN
  INSERT INTO purchase_orders (purchase_order_name, status, notes, date_ordered, date_received, vendor_id, discount) VALUES (
    record_array[1], -- PO Name
    record_array[2], -- PO Status
    record_array[3], -- PO Notes
    record_array[4]::timestamptz, -- Date Ordered
    record_array[5]::timestamptz, -- Date Received
    record_array[6]::bigint, -- Vendor ID
    record_array[7]::integer -- PO Discount
  ) RETURNING * INTO new_purchase_order;

  RETURN new_purchase_order;
END;
$$;


ALTER FUNCTION "public"."create_purchase_order"("record_array" "text"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."requests_to_process" (
    "request_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "purchase_order_id" bigint,
    "notes" "text",
    "status" "text" NOT NULL,
    "labels_printed" boolean,
    "ship_label" boolean,
    "priority" "text" NOT NULL,
    "ship_to_amz" integer,
    "deadline" timestamp with time zone,
    "warehouse_qty" integer,
    "picklist_id" bigint,
    "container_qty" integer
);


ALTER TABLE "public"."requests_to_process" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_request"("record_array" "text"[]) RETURNS "public"."requests_to_process"
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
  new_request requests_to_process;

BEGIN
  
  INSERT INTO requests_to_process (
    product_id,
    purchase_order_id,
    notes,
    status,
    labels_printed,
    ship_label,
    priority,
    ship_to_amz,
    deadline,
    warehouse_qty
  ) VALUES (
    record_array[1]::bigint, -- Product ID
    record_array[2]::bigint, -- Purchase Order ID
    record_array[3], -- Notes
    record_array[4], -- Status
    record_array[5]::boolean, -- Labels printed?
    record_array[6]::boolean, -- Shipping labels printed?
    record_array[7], -- Prioirty
    record_array[8]::integer, -- Ship to amazon
    record_array[9]::timestamptz, -- Deadline
    record_array[10]::integer -- Store in warehouse
  ) RETURNING * INTO new_request;

  RETURN new_request;
END;
$$;


ALTER FUNCTION "public"."create_request"("record_array" "text"[]) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "vendor_id" bigint NOT NULL,
    "vendor_name" "text" NOT NULL,
    "vendor_nickname" "text",
    "contact_email" "text",
    "contact_name" "text"
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_vendor"("record_array" "text"[]) RETURNS "public"."vendors"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_vendor vendors;

BEGIN
  INSERT INTO vendors (vendor_name, vendor_nickname, contact_email, contact_name) VALUES (
    record_array[1], -- Vendor Name
    record_array[2], -- Vendor Nickname
    record_array[3], -- Contact Email
    record_array[4] -- Conctact Name
  ) RETURNING * INTO new_vendor;

  RETURN new_vendor;
END;
$$;


ALTER FUNCTION "public"."create_vendor"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_product_by_id"("record_id" bigint) RETURNS "void"
    LANGUAGE "sql"
    AS $$
  DELETE FROM products WHERE product_id = record_id;
$$;


ALTER FUNCTION "public"."delete_product_by_id"("record_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dynamic_pagination"("select_function" "text", "page_number" integer, "total_records" integer, "order_field" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  return_array text[][];

BEGIN
  

  RETURN return_array;
END;
$$;


ALTER FUNCTION "public"."dynamic_pagination"("select_function" "text", "page_number" integer, "total_records" integer, "order_field" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."edit_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) RETURNS "public"."products"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_product products;
  input_recipe_element text[];
  recipe_id_value bigint;

BEGIN
  SELECT * FROM _edit_product_common_text(product_record) INTO updated_product;

  -- RAISE EXCEPTION 'RECIPE ARRAY: %', recipe_array;
  -- Loop through the recipe array and update the input element(s)
  FOREACH input_recipe_element SLICE 1 IN ARRAY recipe_array LOOP
    IF NULLIF(input_recipe_element[4],'')::bigint IS NOT NULL THEN
    -- Recipe element exists: update
      IF recipe_id_value IS NULL THEN
        recipe_id_value := input_recipe_element[4]::bigint;
      END IF;

      UPDATE recipe_elements SET 
      product_id = input_recipe_element[2]::bigint, 
      qty = input_recipe_element[3]::integer 
      WHERE recipe_element_id = input_recipe_element[1]::bigint; 
    ELSE
    -- RAISE EXCEPTION 'NEW RECIPE ELEMENT: %', input_recipe_element;
    -- Recipe element does not exist: add
      INSERT INTO recipe_elements (product_id, recipe_id, qty, type) VALUES (
        input_recipe_element[2]::bigint, -- Input Product
        recipe_id_value, -- Linked Recipe Id
        input_recipe_element[3]::integer, -- Element QTY
        'input' -- Element Type
      );

    END IF;
  END LOOP;

  RETURN updated_product;

END;
$$;


ALTER FUNCTION "public"."edit_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."edit_raw_product_text"("product_record" "text"[]) RETURNS "public"."products"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_product products;

BEGIN
  SELECT * FROM _edit_product_common_text(product_record) INTO updated_product;

  RETURN updated_product;
END;
$$;


ALTER FUNCTION "public"."edit_raw_product_text"("product_record" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_product_keys"() RETURNS SETOF "public"."products"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM products;
$$;


ALTER FUNCTION "public"."get_all_product_keys"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_product_keys_with_vendors"() RETURNS SETOF "public"."products"
    LANGUAGE "plpgsql"
    AS $$
  DECLARE
  key_vendor_name text;
  product_vendor_set products[];
  product products;

BEGIN
  FOR product IN SELECT * FROM products
  LOOP
    SELECT v.vendor_name INTO key_vendor_name FROM vendors v WHERE v.vendor_id = product.vendor_id;
    INSERT INTO product_vendor_set VALUES (product);
  END LOOP;

  RETURN NEXT product_vendor_set;

END;
$$;


ALTER FUNCTION "public"."get_all_product_keys_with_vendors"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_boxes_and_cases"() RETURNS SETOF "public"."cases"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM cases;
$$;


ALTER FUNCTION "public"."get_boxes_and_cases"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cases_by_type"("processed" boolean) RETURNS SETOF "public"."case_with_product_name"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Want to try looking into dynamic postgres functions, but for now, will use a simple if else statment
  -- with individual queries

  IF processed = TRUE THEN
    RETURN QUERY
    SELECT cases.case_id, cases.units_per_case, cases.date_received, cases.notes, cases.product_id, cases.location_id, 
    cases.status, cases.purchase_order_id, cases.request_id, products.name 
    FROM cases 
    INNER JOIN products ON cases.product_id = products.product_id 
    WHERE ((products.fnsku IS NOT NULL OR products.asin IS NOT NULL) AND (products.fnsku <> '' OR products.asin <> ''));
  ELSE
    RETURN QUERY
    SELECT cases.case_id, cases.units_per_case, cases.date_received, cases.notes, cases.product_id, cases.location_id, cases.status, cases.purchase_order_id, cases.request_id, products.name 
    FROM cases 
    INNER JOIN products ON cases.product_id = products.product_id 
    WHERE ((products.fnsku IS NULL AND products.asin IS NULL) OR (products.fnsku = '' AND products.asin = '') OR (products.fnsku IS NULL AND products.asin = '') OR (products.fnsku = '' AND products.asin IS NULL));
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_cases_by_type"("processed" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cases_by_type_for_po"("processed" boolean, "po_ids" bigint[]) RETURNS SETOF "public"."case_with_product_name"
    LANGUAGE "plpgsql" STABLE
    AS $$
declare
  ids int[];
BEGIN
  -- Want to try looking into dynamic postgres functions, but for now, will use a simple if else statment
  -- with individual queries

  -- RAISE EXCEPTION 'po ids: %', po_ids;

  IF processed = TRUE THEN
    RETURN QUERY
    SELECT cases.case_id, cases.units_per_case, cases.date_received, cases.notes, cases.product_id, cases.location_id, 
    cases.status, cases.purchase_order_id, cases.request_id, products.name 
    FROM cases 
    INNER JOIN products ON cases.product_id = products.product_id 
    WHERE  -- product has a non-empty identifier (fnsku OR asin)
      (COALESCE(NULLIF(products.fnsku, ''), NULLIF(products.asin, '')) IS NOT NULL)
      -- apply PO filter only when po_ids provided
      AND (po_ids IS NULL OR array_length(po_ids,1) = 0 OR cases.purchase_order_id = ANY(po_ids));
  ELSE
    RETURN QUERY
    SELECT cases.case_id, cases.units_per_case, cases.date_received, cases.notes, cases.product_id, cases.location_id, cases.status, cases.purchase_order_id, cases.request_id, products.name 
    FROM cases 
    INNER JOIN products ON cases.product_id = products.product_id 
    WHERE 
      -- product missing identifier (either both null/empty)
      (COALESCE(NULLIF(products.fnsku, ''), NULLIF(products.asin, '')) IS NULL)
      -- apply PO filter only when po_ids provided
      AND (po_ids IS NULL OR array_length(po_ids,1) = 0 OR cases.purchase_order_id = ANY(po_ids));
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_cases_by_type_for_po"("processed" boolean, "po_ids" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_delivered_cases_by_type"("processed" boolean) RETURNS SETOF "public"."case_with_product_name"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  -- Want to try looking into dynamic postgres functions, but for now, will use a simple if else statment
  -- with individual queries

  IF processed = TRUE THEN
    RETURN QUERY
    SELECT 
      cases.case_id, 
      cases.units_per_case, 
      cases.date_received, 
      cases.notes, 
      cases.product_id, 
      cases.location_id, 
      cases.status, 
      cases.purchase_order_id,
      cases.request_id, 
      products.name
    FROM cases 
    INNER JOIN products ON cases.product_id = products.product_id 
    WHERE ((products.fnsku IS NOT NULL OR products.asin IS NOT NULL) AND (products.fnsku <> '' OR products.asin <> '')) AND 
    ((cases.status <> 'Draft') AND (cases.status <> 'Submitted') AND (cases.status <> 'Ordered') AND (cases.status <> 'Inbound') AND 
    (cases.status <> 'BO') AND (cases.status <> 'Back Ordered')) OR (cases.status IS NULL);
  ELSE
    RETURN QUERY
    SELECT 
      cases.case_id, 
      cases.units_per_case, 
      cases.date_received, 
      cases.notes, 
      cases.product_id, 
      cases.location_id, 
      cases.status, 
      cases.purchase_order_id, 
      cases.request_id, 
      products.name 
    FROM cases 
    INNER JOIN products ON cases.product_id = products.product_id 
    WHERE ((products.fnsku IS NULL AND products.asin IS NULL) OR (products.fnsku = '' AND products.asin = '') OR 
    (products.fnsku IS NULL AND products.asin = '') OR (products.fnsku = '' AND products.asin IS NULL)) AND ((cases.status <> 'Draft') AND (cases.status <> 'Submitted') AND (cases.status <> 'Ordered') AND (cases.status <> 'Inbound') AND 
    (cases.status <> 'BO') AND 
    (cases.status <> 'Back Ordered')) OR (cases.status IS NULL);
  END IF;
END;$$;


ALTER FUNCTION "public"."get_delivered_cases_by_type"("processed" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_locations"() RETURNS SETOF "public"."locations"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM locations;
$$;


ALTER FUNCTION "public"."get_locations"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_proc_product_keys"() RETURNS SETOF "public"."products"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM products WHERE (fnsku IS NOT NULL OR asin IS NOT NULL);
$$;


ALTER FUNCTION "public"."get_proc_product_keys"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchase_orders"() RETURNS SETOF "public"."purchase_orders"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM purchase_orders;
$$;


ALTER FUNCTION "public"."get_purchase_orders"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchase_orders_with_details"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$DECLARE
  v_offset integer := GREATEST((in_page - 1), 0) * GREATEST(in_rows_per_page, 1);
  v_po_ids bigint[];
  v_total_count bigint;
  v_result jsonb;
  v_sort_order text;
  test RECORD;
BEGIN
  -- Use helper to get total_count and p.o. ids for this page
  SELECT total_count, po_ids
  INTO v_total_count, v_po_ids
  FROM public._get_purchase_order_ids_helper(in_page, in_rows_per_page, in_filter_field, in_filter_data, in_sort_field, in_sort_order);

  -- RAISE EXCEPTION 'CHECKING IN DETAILS - test: %', test;
  -- RAISE EXCEPTION 'CHECKING IN DETAILS - total count: % and po ids: %', v_total_count, v_po_ids;


  -- If no POs found return empty structure
  IF v_po_ids IS NULL OR array_length(v_po_ids,1) = 0 THEN
    v_result := jsonb_build_object(
      'total_count', COALESCE(v_total_count,0),
      'page', in_page,
      'rows_per_page', in_rows_per_page,
      'purchase_orders', jsonb '[]',
      'all_boxes',           jsonb '[]',
      'all_po_recipes',      jsonb '[]',
      'all_recipes',         jsonb '[]',
      'all_recipe_elements', jsonb '[]',
      'all_products',        jsonb '[]'
    );
    RETURN v_result;
  END IF;

  WITH selected_pos AS (
    SELECT po.*
    FROM purchase_orders po
    WHERE po.purchase_order_id = ANY(v_po_ids)
    ORDER BY array_position(v_po_ids, po.purchase_order_id)
  ),

  -- All cases for these POs with product metadata
  po_cases AS (
    SELECT
      c.*,
      p.product_id   AS product_product_id,
      p.name         AS product_name,
      p.fnsku        AS product_fnsku,
      p.asin         AS product_asin,
      p.item_num     AS product_item_num,
      p.upc          AS product_upc
    FROM cases c
    LEFT JOIN products p ON c.product_id = p.product_id
    WHERE c.purchase_order_id = ANY(v_po_ids)
  ),

  -- Individual boxes (unprocessed cases) per PO as JSON arrays
  individual_boxes_agg AS (
    SELECT
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
        ) ORDER BY c.case_id
      ) AS individual_boxes_json
    FROM po_cases c
    WHERE coalesce(nullif(c.product_fnsku,''), nullif(c.product_asin,'')) IS NULL -- unprocessed = boxes
    GROUP BY c.purchase_order_id
  ),

  page_boxes AS (
    SELECT *
    FROM cases
    WHERE purchase_order_id = ANY(v_po_ids) 
  ),

  -- Grouped boxes (unprocessed) per PO
  grouped_boxes AS (
    SELECT
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
        ) ORDER BY pb.product_product_id
      ) AS grouped_boxes_json
    FROM (
      SELECT
        purchase_order_id,
        product_product_id,
        product_name,
        product_fnsku,
        product_asin,
        product_item_num,
        product_upc,
        count(*) AS cnt,
        COALESCE(sum(units_per_case),0) AS total_units
      FROM po_cases
      WHERE coalesce(nullif(product_fnsku,''), nullif(product_asin,'')) IS NULL -- unprocessed
      GROUP BY purchase_order_id, product_product_id, product_name, product_fnsku, product_asin, product_item_num, product_upc
    ) pb
    GROUP BY pb.purchase_order_id
  ),

  -- Grouped cases (processed) per PO
  grouped_cases AS (
    SELECT
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
        ) ORDER BY pc.product_product_id
      ) AS grouped_cases_json
    FROM (
      SELECT
        purchase_order_id,
        product_product_id,
        product_name,
        product_fnsku,
        product_asin,
        product_item_num,
        product_upc,
        count(*) AS cnt,
        COALESCE(sum(units_per_case),0) AS total_units
      FROM po_cases
      WHERE coalesce(nullif(product_fnsku,''), nullif(product_asin,'')) IS NOT NULL -- processed
      GROUP BY purchase_order_id, product_product_id, product_name, product_fnsku, product_asin, product_item_num, product_upc
    ) pc
    GROUP BY pc.purchase_order_id
  ),

  -- po_recipes per PO
  po_recipes_per_po AS (
    SELECT
      pr.purchase_order_id,
      jsonb_agg(to_jsonb(pr) ORDER BY pr.po_recipe_id) AS po_recipes_json,
      array_agg(pr.recipe_id) FILTER (WHERE pr.recipe_id IS NOT NULL) AS recipe_ids
    FROM po_recipes pr
    WHERE pr.purchase_order_id = ANY(v_po_ids)
    GROUP BY pr.purchase_order_id
  ),

  -- recipes referenced by po_recipes for the page (we'll attach per-PO by matching recipe_ids)
  recipes_for_page AS (
    SELECT r.*
    FROM recipes r
    WHERE r.recipe_id IN (
      SELECT DISTINCT recipe_id FROM po_recipes WHERE purchase_order_id = ANY(v_po_ids)
    )
  ),

  -- recipe_elements referenced by those recipes
  recipe_elements_for_page AS (
    SELECT re.*
    FROM recipe_elements re
    WHERE re.recipe_id IN (SELECT recipe_id FROM recipes_for_page)
  ),

  -- Build per-PO recipes and elements JSON by joining recipe ids
  per_po_recipes_json AS (
    SELECT
      p.purchase_order_id,
      COALESCE(p.po_recipes_json, '[]'::jsonb) AS po_recipes_json,
      COALESCE(
        (
          SELECT jsonb_agg(to_jsonb(r) ORDER BY r.recipe_id)
          FROM recipes_for_page r
          WHERE r.recipe_id = ANY(p.recipe_ids)
        ), '[]'::jsonb
      ) AS recipes_json,
      COALESCE(
        (
          SELECT jsonb_agg(to_jsonb(re) ORDER BY re.recipe_element_id)
          FROM recipe_elements_for_page re
          WHERE re.recipe_id = ANY(p.recipe_ids)
        ), '[]'::jsonb
      ) AS recipe_elements_json
    FROM po_recipes_per_po p
  ), 

  all_boxes_agg AS (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'case_id',           c.case_id,
                'purchase_order_id', c.purchase_order_id,
                'product_id',        c.product_id,
                'product_name',      c.product_name,
                'units_per_case',    c.units_per_case,
                'status',            c.status,
                'location_id',       c.location_id,
                'request_id',        c.request_id,
                'date_received',     c.date_received,
                'notes',             c.notes,
                'item_num',          c.product_item_num,
                'upc',               c.product_upc
            ) ORDER BY c.case_id
        ), '[]'::jsonb) AS j
        FROM po_cases c
        WHERE COALESCE(NULLIF(c.product_fnsku, ''), NULLIF(c.product_asin, '')) IS NULL
    ),

    -- → this.poRecipes
    all_po_recipes_agg AS (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'po_recipe_id',      pr.po_recipe_id,
                'purchase_order_id', pr.purchase_order_id,
                'recipe_id',         pr.recipe_id,
                'qty',               pr.qty
            ) ORDER BY pr.po_recipe_id
        ), '[]'::jsonb) AS j
        FROM po_recipes pr
        WHERE pr.purchase_order_id = ANY(v_po_ids)
    ),

    -- → this.displayRecipes
    all_recipes_agg AS (
        SELECT COALESCE(jsonb_agg(to_jsonb(r) ORDER BY r.recipe_id), '[]'::jsonb) AS j
        FROM recipes_for_page r
    ),

    -- → this.displayRecipeElements
    all_recipe_elements_agg AS (
        SELECT COALESCE(jsonb_agg(to_jsonb(re) ORDER BY re.recipe_element_id), '[]'::jsonb) AS j
        FROM recipe_elements_for_page re
    ),

    -- → this.products
    all_products_agg AS (
        SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.product_id), '[]'::jsonb) AS j
        FROM products p
        WHERE p.product_id IN (SELECT DISTINCT product_id FROM po_cases)
           OR p.product_id IN (SELECT DISTINCT product_id FROM recipe_elements_for_page)
    )

  SELECT jsonb_build_object(
    'total_count', v_total_count,
    'page', in_page,
    'rows_per_page', in_rows_per_page,
    'purchase_orders',
      COALESCE(
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
            'grouped_cases', COALESCE(gc.grouped_cases_json, '[]'::jsonb),
            'grouped_boxes', COALESCE(gb.grouped_boxes_json, '[]'::jsonb),
            'individual_boxes', COALESCE(ib.individual_boxes_json, '[]'::jsonb),
            'po_recipes', COALESCE(pr.po_recipes_json, '[]'::jsonb),
            'recipes', COALESCE(pr.recipes_json, '[]'::jsonb),
            'recipe_elements', COALESCE(pr.recipe_elements_json, '[]'::jsonb)
          ) ORDER BY array_position(v_po_ids, sp.purchase_order_id)
        ),
        '[]'::jsonb
      ),
    'all_boxes', (SELECT j FROM all_boxes_agg),
    'all_po_recipes', (SELECT j FROM all_po_recipes_agg),
    'all_recipes', (SELECT j FROM all_recipes_agg),
    'all_recipe_elements', (SELECT j FROM all_recipe_elements_agg),
    'all_products', (SELECT j FROM all_products_agg)
  )
  INTO v_result
  FROM selected_pos sp
  LEFT JOIN vendors v ON v.vendor_id = sp.vendor_id
  LEFT JOIN grouped_cases gc ON gc.purchase_order_id = sp.purchase_order_id
  LEFT JOIN grouped_boxes gb ON gb.purchase_order_id = sp.purchase_order_id
  LEFT JOIN individual_boxes_agg ib ON ib.purchase_order_id = sp.purchase_order_id
  LEFT JOIN per_po_recipes_json pr ON pr.purchase_order_id = sp.purchase_order_id;


  RETURN v_result;
END;$$;


ALTER FUNCTION "public"."get_purchase_orders_with_details"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchase_orders_with_details_3"("in_page" integer, "in_rows_per_page" integer, "in_filter_data" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$DECLARE
  v_offset integer := GREATEST((in_page - 1), 0) * GREATEST(in_rows_per_page, 1);
  v_po_ids bigint[];
  v_total_count bigint;
  v_result jsonb;
BEGIN
  -- Normalize filter: if null or empty -> no filter
  IF in_filter_data IS NULL OR btrim(in_filter_data) = '' THEN
    SELECT count(*) INTO v_total_count FROM purchase_orders;
    SELECT array_agg(p.purchase_order_id ORDER BY p.purchase_order_id)
    FROM (
      SELECT purchase_order_id
      FROM purchase_orders
      ORDER BY purchase_order_id
      OFFSET v_offset
      LIMIT in_rows_per_page
    ) p INTO v_po_ids;
  ELSE
    SELECT count(*) INTO v_total_count
    FROM purchase_orders po
    WHERE po.purchase_order_name ILIKE ('%' || in_filter_data || '%')
       OR coalesce(po.notes, '') ILIKE ('%' || in_filter_data || '%');

    SELECT array_agg(p.purchase_order_id ORDER BY p.purchase_order_id)
    FROM (
      SELECT purchase_order_id
      FROM purchase_orders po
      WHERE po.purchase_order_name ILIKE ('%' || in_filter_data || '%')
         OR coalesce(po.notes, '') ILIKE ('%' || in_filter_data || '%')
      ORDER BY po.purchase_order_id
      OFFSET v_offset
      LIMIT in_rows_per_page
    ) p INTO v_po_ids;
  END IF;

  -- If no POs found return empty structure
  IF v_po_ids IS NULL OR array_length(v_po_ids,1) = 0 THEN
    v_result := jsonb_build_object(
      'total_count', COALESCE(v_total_count,0),
      'page', in_page,
      'rows_per_page', in_rows_per_page,
      'purchase_orders', jsonb '[]'
    );
    RETURN v_result;
  END IF;

  WITH selected_pos AS (
    SELECT po.*
    FROM purchase_orders po
    WHERE po.purchase_order_id = ANY(v_po_ids)
    ORDER BY array_position(v_po_ids, po.purchase_order_id)
  ),

  -- All cases for these POs with product metadata
  po_cases AS (
    SELECT
      c.*,
      p.product_id   AS product_product_id,
      p.name         AS product_name,
      p.fnsku        AS product_fnsku,
      p.asin         AS product_asin,
      p.item_num     AS product_item_num,
      p.upc          AS product_upc
    FROM cases c
    LEFT JOIN products p ON c.product_id = p.product_id
    WHERE c.purchase_order_id = ANY(v_po_ids)
  ),

  -- Individual boxes (unprocessed cases) per PO as JSON arrays
  individual_boxes_agg AS (
    SELECT
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
        ) ORDER BY c.case_id
      ) AS individual_boxes_json
    FROM po_cases c
    WHERE coalesce(nullif(c.product_fnsku,''), nullif(c.product_asin,'')) IS NULL -- unprocessed = boxes
    GROUP BY c.purchase_order_id
  ),

  -- Grouped boxes (unprocessed) per PO
  grouped_boxes AS (
    SELECT
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
        ) ORDER BY pb.product_product_id
      ) AS grouped_boxes_json
    FROM (
      SELECT
        purchase_order_id,
        product_product_id,
        product_name,
        product_fnsku,
        product_asin,
        product_item_num,
        product_upc,
        count(*) AS cnt,
        COALESCE(sum(units_per_case),0) AS total_units
      FROM po_cases
      WHERE coalesce(nullif(product_fnsku,''), nullif(product_asin,'')) IS NULL -- unprocessed
      GROUP BY purchase_order_id, product_product_id, product_name, product_fnsku, product_asin, product_item_num, product_upc
    ) pb
    GROUP BY pb.purchase_order_id
  ),

  -- Grouped cases (processed) per PO
  grouped_cases AS (
    SELECT
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
        ) ORDER BY pc.product_product_id
      ) AS grouped_cases_json
    FROM (
      SELECT
        purchase_order_id,
        product_product_id,
        product_name,
        product_fnsku,
        product_asin,
        product_item_num,
        product_upc,
        count(*) AS cnt,
        COALESCE(sum(units_per_case),0) AS total_units
      FROM po_cases
      WHERE coalesce(nullif(product_fnsku,''), nullif(product_asin,'')) IS NOT NULL -- processed
      GROUP BY purchase_order_id, product_product_id, product_name, product_fnsku, product_asin, product_item_num, product_upc
    ) pc
    GROUP BY pc.purchase_order_id
  ),

  -- po_recipes per PO
  po_recipes_per_po AS (
    SELECT
      pr.purchase_order_id,
      jsonb_agg(to_jsonb(pr) ORDER BY pr.po_recipe_id) AS po_recipes_json,
      array_agg(pr.recipe_id) FILTER (WHERE pr.recipe_id IS NOT NULL) AS recipe_ids
    FROM po_recipes pr
    WHERE pr.purchase_order_id = ANY(v_po_ids)
    GROUP BY pr.purchase_order_id
  ),

  -- recipes referenced by po_recipes for the page (we'll attach per-PO by matching recipe_ids)
  recipes_for_page AS (
    SELECT r.*
    FROM recipes r
    WHERE r.recipe_id IN (
      SELECT DISTINCT recipe_id FROM po_recipes WHERE purchase_order_id = ANY(v_po_ids)
    )
  ),

  -- recipe_elements referenced by those recipes
  recipe_elements_for_page AS (
    SELECT re.*
    FROM recipe_elements re
    WHERE re.recipe_id IN (SELECT recipe_id FROM recipes_for_page)
  ),

  -- Build per-PO recipes and elements JSON by joining recipe ids
  per_po_recipes_json AS (
    SELECT
      p.purchase_order_id,
      COALESCE(p.po_recipes_json, '[]'::jsonb) AS po_recipes_json,
      COALESCE(
        (
          SELECT jsonb_agg(to_jsonb(r) ORDER BY r.recipe_id)
          FROM recipes_for_page r
          WHERE r.recipe_id = ANY(p.recipe_ids)
        ), '[]'::jsonb
      ) AS recipes_json,
      COALESCE(
        (
          SELECT jsonb_agg(to_jsonb(re) ORDER BY re.recipe_element_id)
          FROM recipe_elements_for_page re
          WHERE re.recipe_id = ANY(p.recipe_ids)
        ), '[]'::jsonb
      ) AS recipe_elements_json
    FROM po_recipes_per_po p
  )

  SELECT jsonb_agg(
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
      'grouped_cases', COALESCE(gc.grouped_cases_json, '[]'::jsonb),
      'grouped_boxes', COALESCE(gb.grouped_boxes_json, '[]'::jsonb),
      'individual_boxes', COALESCE(ib.individual_boxes_json, '[]'::jsonb),
      'po_recipes', COALESCE(pr.po_recipes_json, '[]'::jsonb),
      'recipes', COALESCE(pr.recipes_json, '[]'::jsonb),
      'recipe_elements', COALESCE(pr.recipe_elements_json, '[]'::jsonb)
    ) ORDER BY array_position(v_po_ids, sp.purchase_order_id)
  ) INTO v_result
  FROM selected_pos sp
  LEFT JOIN vendors v ON v.vendor_id = sp.vendor_id
  LEFT JOIN grouped_cases gc ON gc.purchase_order_id = sp.purchase_order_id
  LEFT JOIN grouped_boxes gb ON gb.purchase_order_id = sp.purchase_order_id
  LEFT JOIN individual_boxes_agg ib ON ib.purchase_order_id = sp.purchase_order_id
  LEFT JOIN per_po_recipes_json pr ON pr.purchase_order_id = sp.purchase_order_id;

  -- Wrap with pagination metadata
  v_result := jsonb_build_object(
    'total_count', v_total_count,
    'page', in_page,
    'rows_per_page', in_rows_per_page,
    'purchase_orders', COALESCE(v_result, '[]'::jsonb)
  );

  RETURN v_result;
END;$$;


ALTER FUNCTION "public"."get_purchase_orders_with_details_3"("in_page" integer, "in_rows_per_page" integer, "in_filter_data" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_purchase_orders_with_detailsold"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  v_offset integer := GREATEST((in_page - 1), 0) * GREATEST(in_rows_per_page, 1);
  v_po_ids bigint[];
  v_total_count bigint;
  v_result jsonb;
  v_sort_order text;
BEGIN
  -- Normalize filter: if null or empty -> no filter
  IF in_filter_data IS NULL OR btrim(in_filter_data) = '' THEN
    SELECT count(*) INTO v_total_count FROM purchase_orders;
    SELECT array_agg(p.purchase_order_id ORDER BY p.purchase_order_id)
    FROM (
      SELECT purchase_order_id
      FROM purchase_orders
      ORDER BY purchase_order_id
      OFFSET v_offset
      LIMIT in_rows_per_page
    ) p INTO v_po_ids;
  ELSE
    SELECT count(*) INTO v_total_count
    FROM purchase_orders po
    WHERE po.purchase_order_name ILIKE ('%' || in_filter_data || '%')
       OR coalesce(po.notes, '') ILIKE ('%' || in_filter_data || '%');

    SELECT array_agg(p.purchase_order_id ORDER BY p.purchase_order_id)
    FROM (
      SELECT purchase_order_id
      FROM purchase_orders po
      WHERE po.purchase_order_name ILIKE ('%' || in_filter_data || '%')
         OR coalesce(po.notes, '') ILIKE ('%' || in_filter_data || '%')
      ORDER BY po.purchase_order_id
      OFFSET v_offset
      LIMIT in_rows_per_page
    ) p INTO v_po_ids;
  END IF;

  -- If no POs found return empty structure
  IF v_po_ids IS NULL OR array_length(v_po_ids,1) = 0 THEN
    v_result := jsonb_build_object(
      'total_count', COALESCE(v_total_count,0),
      'page', in_page,
      'rows_per_page', in_rows_per_page,
      'purchase_orders', jsonb '[]'
    );
    RETURN v_result;
  END IF;

  WITH selected_pos AS (
    SELECT po.*
    FROM purchase_orders po
    WHERE po.purchase_order_id = ANY(v_po_ids)
    ORDER BY array_position(v_po_ids, po.purchase_order_id)
  ),

  -- All cases for these POs with product metadata
  po_cases AS (
    SELECT
      c.*,
      p.product_id   AS product_product_id,
      p.name         AS product_name,
      p.fnsku        AS product_fnsku,
      p.asin         AS product_asin,
      p.item_num     AS product_item_num,
      p.upc          AS product_upc
    FROM cases c
    LEFT JOIN products p ON c.product_id = p.product_id
    WHERE c.purchase_order_id = ANY(v_po_ids)
  ),

  -- Individual boxes (unprocessed cases) per PO as JSON arrays
  individual_boxes_agg AS (
    SELECT
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
        ) ORDER BY c.case_id
      ) AS individual_boxes_json
    FROM po_cases c
    WHERE coalesce(nullif(c.product_fnsku,''), nullif(c.product_asin,'')) IS NULL -- unprocessed = boxes
    GROUP BY c.purchase_order_id
  ),

  -- Grouped boxes (unprocessed) per PO
  grouped_boxes AS (
    SELECT
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
        ) ORDER BY pb.product_product_id
      ) AS grouped_boxes_json
    FROM (
      SELECT
        purchase_order_id,
        product_product_id,
        product_name,
        product_fnsku,
        product_asin,
        product_item_num,
        product_upc,
        count(*) AS cnt,
        COALESCE(sum(units_per_case),0) AS total_units
      FROM po_cases
      WHERE coalesce(nullif(product_fnsku,''), nullif(product_asin,'')) IS NULL -- unprocessed
      GROUP BY purchase_order_id, product_product_id, product_name, product_fnsku, product_asin, product_item_num, product_upc
    ) pb
    GROUP BY pb.purchase_order_id
  ),

  -- Grouped cases (processed) per PO
  grouped_cases AS (
    SELECT
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
        ) ORDER BY pc.product_product_id
      ) AS grouped_cases_json
    FROM (
      SELECT
        purchase_order_id,
        product_product_id,
        product_name,
        product_fnsku,
        product_asin,
        product_item_num,
        product_upc,
        count(*) AS cnt,
        COALESCE(sum(units_per_case),0) AS total_units
      FROM po_cases
      WHERE coalesce(nullif(product_fnsku,''), nullif(product_asin,'')) IS NOT NULL -- processed
      GROUP BY purchase_order_id, product_product_id, product_name, product_fnsku, product_asin, product_item_num, product_upc
    ) pc
    GROUP BY pc.purchase_order_id
  ),

  -- po_recipes per PO
  po_recipes_per_po AS (
    SELECT
      pr.purchase_order_id,
      jsonb_agg(to_jsonb(pr) ORDER BY pr.po_recipe_id) AS po_recipes_json,
      array_agg(pr.recipe_id) FILTER (WHERE pr.recipe_id IS NOT NULL) AS recipe_ids
    FROM po_recipes pr
    WHERE pr.purchase_order_id = ANY(v_po_ids)
    GROUP BY pr.purchase_order_id
  ),

  -- recipes referenced by po_recipes for the page (we'll attach per-PO by matching recipe_ids)
  recipes_for_page AS (
    SELECT r.*
    FROM recipes r
    WHERE r.recipe_id IN (
      SELECT DISTINCT recipe_id FROM po_recipes WHERE purchase_order_id = ANY(v_po_ids)
    )
  ),

  -- recipe_elements referenced by those recipes
  recipe_elements_for_page AS (
    SELECT re.*
    FROM recipe_elements re
    WHERE re.recipe_id IN (SELECT recipe_id FROM recipes_for_page)
  ),

  -- Build per-PO recipes and elements JSON by joining recipe ids
  per_po_recipes_json AS (
    SELECT
      p.purchase_order_id,
      COALESCE(p.po_recipes_json, '[]'::jsonb) AS po_recipes_json,
      COALESCE(
        (
          SELECT jsonb_agg(to_jsonb(r) ORDER BY r.recipe_id)
          FROM recipes_for_page r
          WHERE r.recipe_id = ANY(p.recipe_ids)
        ), '[]'::jsonb
      ) AS recipes_json,
      COALESCE(
        (
          SELECT jsonb_agg(to_jsonb(re) ORDER BY re.recipe_element_id)
          FROM recipe_elements_for_page re
          WHERE re.recipe_id = ANY(p.recipe_ids)
        ), '[]'::jsonb
      ) AS recipe_elements_json
    FROM po_recipes_per_po p
  )

  SELECT jsonb_agg(
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
      'grouped_cases', COALESCE(gc.grouped_cases_json, '[]'::jsonb),
      'grouped_boxes', COALESCE(gb.grouped_boxes_json, '[]'::jsonb),
      'individual_boxes', COALESCE(ib.individual_boxes_json, '[]'::jsonb),
      'po_recipes', COALESCE(pr.po_recipes_json, '[]'::jsonb),
      'recipes', COALESCE(pr.recipes_json, '[]'::jsonb),
      'recipe_elements', COALESCE(pr.recipe_elements_json, '[]'::jsonb)
    ) ORDER BY array_position(v_po_ids, sp.purchase_order_id)
  ) INTO v_result
  FROM selected_pos sp
  LEFT JOIN vendors v ON v.vendor_id = sp.vendor_id
  LEFT JOIN grouped_cases gc ON gc.purchase_order_id = sp.purchase_order_id
  LEFT JOIN grouped_boxes gb ON gb.purchase_order_id = sp.purchase_order_id
  LEFT JOIN individual_boxes_agg ib ON ib.purchase_order_id = sp.purchase_order_id
  LEFT JOIN per_po_recipes_json pr ON pr.purchase_order_id = sp.purchase_order_id;

  -- Wrap with pagination metadata
  v_result := jsonb_build_object(
    'total_count', v_total_count,
    'page', in_page,
    'rows_per_page', in_rows_per_page,
    'purchase_orders', COALESCE(v_result, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_purchase_orders_with_detailsold"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_raw_product_keys"() RETURNS SETOF "public"."products"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM products WHERE (fnsku IS NULL AND asin IS NULL);
$$;


ALTER FUNCTION "public"."get_raw_product_keys"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_elements" (
    "recipe_element_id" bigint NOT NULL,
    "recipe_id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "type" "text" NOT NULL,
    "qty" numeric NOT NULL
);


ALTER TABLE "public"."recipe_elements" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recipe_elements"() RETURNS SETOF "public"."recipe_elements"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM recipe_elements;
$$;


ALTER FUNCTION "public"."get_recipe_elements"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "recipe_id" bigint NOT NULL,
    "label" "text" NOT NULL,
    "vendor_id" integer NOT NULL
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recipes"() RETURNS SETOF "public"."recipes"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM recipes;
$$;


ALTER FUNCTION "public"."get_recipes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recipes_and_elements_for_vendors"("ven_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
declare
  result jsonb;
  
BEGIN

  WITH found_recipes AS (
    SELECT *
    FROM recipes
    WHERE vendor_id = ven_id
  ),
  found_elements AS (
    SELECT *
    FROM recipe_elements
    WHERE recipe_id IN (SELECT recipe_id FROM found_recipes)
  )

  SELECT jsonb_build_object(
    'recipes', (SELECT jsonb_agg(found_recipes) FROM found_recipes),
    'elements', (SELECT jsonb_agg(found_elements) FROM found_elements)
  ) INTO result;

  RETURN result;

END;
$$;


ALTER FUNCTION "public"."get_recipes_and_elements_for_vendors"("ven_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_recipes_for_pos"("po_ids" bigint[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
declare
  result jsonb;
  
BEGIN

  WITH found_po_recipes AS (
    SELECT *
    FROM po_recipes
    WHERE purchase_order_id = ANY(po_ids)
  ),
  found_recipes AS (
    SELECT *
    FROM recipes
    WHERE recipe_id IN (SELECT recipe_id FROM found_po_recipes)
  ),
  found_elements AS (
    SELECT *
    FROM recipe_elements
    WHERE recipe_id IN (SELECT recipe_id FROM found_recipes)
  )

  SELECT jsonb_build_object(
    'po_recipes', (SELECT jsonb_agg(found_po_recipes) FROM found_po_recipes),
    'recipes', (SELECT jsonb_agg(found_recipes) FROM found_recipes),
    'elements', (SELECT jsonb_agg(found_elements) FROM found_elements)
  ) INTO result;

  RETURN result;

END;
$$;


ALTER FUNCTION "public"."get_recipes_for_pos"("po_ids" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_count"("select_function" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  count integer;

BEGIN
  EXECUTE format('SELECT count(*) FROM %I ', select_function) INTO count;

  RETURN count;
END;
$$;


ALTER FUNCTION "public"."get_table_count"("select_function" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_definitions_and_relationships"() RETURNS TABLE("table_definition" "text", "foreign_key_relationships" "text", "indexes" "text")
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    table_rec RECORD;
    fk_rec RECORD;
    index_rec RECORD;
    fk_relationships text;
    index_list text;
BEGIN
    -- Loop through each table in the public schema
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        -- Initialize the relationships and indexes for the current table
        fk_relationships := '';
        index_list := '';

        -- Get table definition
        table_definition := format(
            'CREATE TABLE %I ('' || string_agg(column_name || '' '' || 
            CASE WHEN is_nullable = ''NO'' THEN ''NOT NULL'' ELSE '''' END || '' '' || udt_name, '', '') || '');', 
            table_rec.table_name
        );

        -- Get foreign key relationships
        FOR fk_rec IN 
            SELECT 
                kcu.table_name AS child_table,
                kcu.column_name AS child_column,
                ccu.table_name AS parent_table,
                ccu.column_name AS parent_column
            FROM 
                information_schema.table_constraints AS tc
            JOIN 
                information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
            JOIN 
                information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
            WHERE 
                tc.constraint_type = 'FOREIGN KEY' 
                AND kcu.table_name = table_rec.table_name
        LOOP
            fk_relationships := fk_relationships || format(
                'Foreign Key: %I.%I references %I.%I; ', 
                fk_rec.child_table, 
                fk_rec.child_column, 
                fk_rec.parent_table, 
                fk_rec.parent_column
            );
        END LOOP;

        -- Get indexes
        FOR index_rec IN 
            SELECT 
                indexname, 
                indexdef 
            FROM 
                pg_indexes 
            WHERE 
                tablename = table_rec.table_name
        LOOP
            index_list := index_list || format(
                'Index: %I on %I; ', 
                index_rec.indexname, 
                index_rec.indexdef
            );
        END LOOP;

        -- Return the results for the current table
        RETURN NEXT;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."get_table_definitions_and_relationships"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_table_schema"() RETURNS TABLE("table_name" "text", "column_name" "text", "data_type" "text", "is_nullable" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
    FROM 
        information_schema.columns
    WHERE 
        table_schema = 'public'
    ORDER BY 
        table_name, ordinal_position;
END;
$$;


ALTER FUNCTION "public"."get_table_schema"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_vendors"() RETURNS SETOF "public"."vendors"
    LANGUAGE "sql"
    AS $$
  SELECT * FROM vendors;
$$;


ALTER FUNCTION "public"."get_vendors"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."global_filter"("filter_string" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  return_array text[][];
  query text;
BEGIN
  -- Construct the dynamic query
  query := format('SELECT * FROM (%s) AS inner_query WHERE %s', select_function, filter_string);

  -- Execute the query and return the results
  EXECUTE query INTO return_array;

  RETURN return_array;
END;
$$;


ALTER FUNCTION "public"."global_filter"("filter_string" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_processed_product_keys"("product_name" "text", "date_added" timestamp with time zone, "do_we_carry" "text", "vendor_name" "text", "fnsku" "text", "asin" "text", "default_units_per_case" integer, "weight_lbs" integer, "box_type" "text", "box_cost" numeric, "process_time_per_unit_sec" integer, "meltable" "text", "products_needed_a" "text", "item_num_a" "text", "qty_1" integer, "products_needed_b" "text", "item_num_b" "text", "qty_2" integer, "products_needed_c" "text", "item_num_c" "text", "qty_3" integer, "products_needed_d" "text", "item_num_d" "text", "qty_4" integer, "products_needed_e" "text", "item_num_e" "text", "qty_5" integer, "products_needed_f" "text", "item_num_f" "text", "qty_6" integer, "bag_cost" numeric, "in_shipping_cost" numeric, "out_shipping_cost" numeric, "labor_cost" numeric, "item_cost" numeric, "unit_box_cost" numeric, "misc_cost" numeric, "amz_fees_cost" numeric, "storage_cost_30_day" numeric, "holiday_storage_cost" numeric, "total_cost" numeric, "total_holiday_cost" numeric, "notes" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."import_processed_product_keys"("product_name" "text", "date_added" timestamp with time zone, "do_we_carry" "text", "vendor_name" "text", "fnsku" "text", "asin" "text", "default_units_per_case" integer, "weight_lbs" integer, "box_type" "text", "box_cost" numeric, "process_time_per_unit_sec" integer, "meltable" "text", "products_needed_a" "text", "item_num_a" "text", "qty_1" integer, "products_needed_b" "text", "item_num_b" "text", "qty_2" integer, "products_needed_c" "text", "item_num_c" "text", "qty_3" integer, "products_needed_d" "text", "item_num_d" "text", "qty_4" integer, "products_needed_e" "text", "item_num_e" "text", "qty_5" integer, "products_needed_f" "text", "item_num_f" "text", "qty_6" integer, "bag_cost" numeric, "in_shipping_cost" numeric, "out_shipping_cost" numeric, "labor_cost" numeric, "item_cost" numeric, "unit_box_cost" numeric, "misc_cost" numeric, "amz_fees_cost" numeric, "storage_cost_30_day" numeric, "holiday_storage_cost" numeric, "total_cost" numeric, "total_holiday_cost" numeric, "notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_processed_product_keys_batch"("record_array" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."import_processed_product_keys_batch"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_processed_product_list_batch"("record_array" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
    -- Function variables
    record text[];
    return_text text;
    current_location_name text;
    current_location_id bigint;
    current_product_name text;
    current_product_id bigint;
    count integer;

    -- Array fields
    status text;
    asin text;
    record_fnsku text;
    units_per_case integer;
    number_of_cases integer;
    notes text;

BEGIN 
    FOREACH record SLICE 1 IN ARRAY record_array LOOP
        status := record[2]; -- Case status
        asin := record[5]; -- Case asin
        record_fnsku := record[7]; -- Case fnsku
        units_per_case := record[8]::integer; -- Units per case
        number_of_cases := record[9]::integer; -- Number of cases (for inner loop)
        notes := record[16]; -- Case notes

        current_location_name := record[3]; -- Location name (used for query)
        current_product_name := record[6]; -- Product name (used for query)

        SELECT p.product_id INTO current_product_id FROM products p WHERE LOWER(p.fnsku) = LOWER(record_fnsku); 

        IF current_product_id IS NULL THEN
            RAISE EXCEPTION 'No product id for record: %', record;
        END IF;

        SELECT location_id INTO current_location_id FROM locations WHERE LOWER(name) = LOWER(current_location_name);

        -- If location does not exist, insert it
        IF current_location_id IS NULL AND current_location_name IS NOT NULL THEN
            INSERT INTO locations(name) VALUES (current_location_name) RETURNING location_id INTO current_location_id;
        END IF;

        FOR count IN 1 .. number_of_cases 
        LOOP
            INSERT INTO cases (units_per_case, notes, product_id, location_id, status) VALUES (
                units_per_case,
                notes,
                current_product_id,
                current_location_id,
                status
            );
        END LOOP;

    END LOOP;

    RETURN 'Record(s) Imported';
END;
$$;


ALTER FUNCTION "public"."import_processed_product_list_batch"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_raw_product_keys"("product_name" "text", "item_number" "text", "product_upc" "text", "vendor_name" "text", "the_2023_price" numeric, "the_2022_price" numeric, "the_2021_price" numeric, "unit_per_box" integer, "map_cost" numeric, "product_notes" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    current_vendor_name text;
    current_vendor_id bigint;
BEGIN
        -- Split the line into fields (assuming comma-separated values)
        current_vendor_name = vendor_name; -- Adjust index based on your CSV structure

        RAISE LOG 'vendor name: %', vendor_name;

        -- Check if vendor exists
        SELECT v.vendor_id INTO current_vendor_id FROM vendors v WHERE v.vendor_name = current_vendor_name;

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
           RAISE EXCEPTION 'Required fields are missing: current_vendor_id: %', current_vendor_id;
            RETURN; -- Skip this iteration if required fields are missing
        END IF;

        -- Insert the product record (adjust the fields as necessary)
        INSERT INTO products (name, item_num, upc, vendor_id, price_2023, price_2022, price_2021, 
        default_units_per_case, map, notes) VALUES (
            product_name, -- Product name
            item_number, -- Item number
            product_upc, -- Product UPC
            current_vendor_id,
            the_2023_price, -- 2023 Price
            the_2022_price, -- 2022 Price
            the_2021_price, -- 2021 Price
            unit_per_box, -- Defualt units per raw box
            map_cost, -- MAP (Minimum Advertised Price)
            product_notes -- Product key notes
        );
END;$$;


ALTER FUNCTION "public"."import_raw_product_keys"("product_name" "text", "item_number" "text", "product_upc" "text", "vendor_name" "text", "the_2023_price" numeric, "the_2022_price" numeric, "the_2021_price" numeric, "unit_per_box" integer, "map_cost" numeric, "product_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_raw_product_keys_batch"("record_array" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    -- Function variables
    current_vendor_name text;
    current_vendor_id bigint;
    record text[];
    record_count integer = 0;
    return_text text;

    -- Array fields
    product_name text;  -- Declare product_name
    item_num text;      -- Declare item_num
    upc text;           -- Declare upc
    price_2023 numeric; -- Declare price_2023
    price_2022 numeric; -- Declare price_2022
    price_2021 numeric; -- Declare price_2021
    default_units_per_case integer; -- Declare default_units_per_case
    map numeric;       -- Declare map
    notes text;        -- Declare notes
BEGIN
    -- Loop through each line of the CSV data
    FOREACH record SLICE 1 IN ARRAY record_array LOOP
        -- Log the current record being processed
        RAISE NOTICE 'Processing record: %', record;

        -- Split the product record into an array of values

        -- Assign values based on their index in the array
        product_name := trim(record[1]); -- 0 index for Product Name
        item_num := trim(record[2]);    -- 1 index for item #
        upc := trim(record[3]);         -- 2 index for UPC
        current_vendor_name := trim(record[4]); -- 3 index for Vendor
        
        -- Attempt to parse prices
        price_2023 := NULLIF(record[5], '')::numeric; -- 4 index for 2023 Price
        price_2022 := NULLIF(record[6], '')::numeric; -- 5 index for 2022 AUG Price
        price_2021 := NULLIF(record[7], '')::numeric; -- 6 index for 2021 Price
        default_units_per_case := NULLIF(record[8], '')::integer; -- 7 index for Units Per Case
        map := NULLIF(record[9], '')::numeric; -- 8 index for MAP
        notes := trim(record[10]); -- 9 index for Notes

        -- Log parsed prices for debugging
        RAISE NOTICE 'Parsed prices - 2023: %, 2022: %, 2021: %', price_2023, price_2022, price_2021;

        -- Check if vendor exists
        SELECT v.vendor_id INTO current_vendor_id FROM vendors v WHERE LOWER(v.vendor_name) = LOWER(current_vendor_name);

        -- If vendor does not exist, insert it
        IF current_vendor_id IS NULL AND current_vendor_name IS NOT NULL THEN
            INSERT INTO vendors (vendor_name) VALUES (current_vendor_name) RETURNING vendor_id INTO current_vendor_id;
        END IF;

        -- Validate required fields before inserting
        IF product_name IS NULL THEN
            RAISE exception 'ERROR: Missing product name: %', record;
            -- CONTINUE; -- Skip this iteration if required fields are missing
        END IF;

        IF current_vendor_id IS NULL THEN
            RAISE exception 'ERROR: Missing vendor id: %', record;
            -- CONTINUE; -- Skip this iteration if required fields are missing
        END IF;

        -- Insert the product record
        INSERT INTO products (name, item_num, upc, vendor_id, price_2023, price_2022, price_2021, 
        default_units_per_case, map, notes) VALUES (
            product_name, 
            item_num, 
            upc, 
            current_vendor_id,
            price_2023, 
            price_2022, 
            price_2021, 
            default_units_per_case, 
            map, 
            notes
        );

        record_count := record_count + 1;
    END LOOP;

    RETURN 'Record(s) Imported';
    -- return_text := 'A total of % record(s) imported', record_count;
    -- RETURN return_text;
END;
$$;


ALTER FUNCTION "public"."import_raw_product_keys_batch"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."import_raw_product_list_batch"("record_array" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
    -- Function variables
    record text[];
    return_text text;
    current_location_name text;
    current_location_id bigint;
    current_product_name text;
    current_product_id bigint;
    count integer;

    -- Array fields
    status text;
    units_per_box integer;
    number_of_boxes integer;
    notes text;

BEGIN 
    FOREACH record SLICE 1 IN ARRAY record_array LOOP
        -- RAISE EXCEPTION 'Record: %', record;
        -- RAISE LOG 'STATUS: %', record[2];
        status := record[2]; -- Box status
        units_per_box := NULLIF(record[7], '')::integer; -- Units per box
        number_of_boxes := NULLIF(record[8], '')::integer; -- Number of boxes (for inner loop)
        notes := record[12]; -- Box notes

        current_location_name := record[3]; -- Location name (used for query)
        current_product_name := record[6]; -- Product name (used for query)

        -- RAISE EXCEPTION 'Units per box: %', record[7];
        -- RAISE EXCEPTION 'Number of boxes: %', record[8];

        RAISE LOG 'Checking record info: Name: %, Location: %, Units per box: %, Notes: %, Status: %', current_product_name, current_location_name, units_per_box, notes, status;
        RAISE LOG 'Checking count: %', number_of_boxes;

        SELECT p.product_id INTO current_product_id FROM products p WHERE LOWER(p.name) = LOWER(current_product_name); 

        IF current_product_id IS NULL THEN
            RAISE EXCEPTION 'No product id for record: %', record;
        END IF;

        IF units_per_box IS NULL THEN
            RAISE EXCEPTION 'Units per box null for record: %', record;
        END IF;

        IF number_of_boxes IS NULL THEN
            RAISE EXCEPTION 'Number of boxes null for record: %', record;
        END IF;

        SELECT location_id INTO current_location_id FROM locations WHERE LOWER(name) = LOWER(current_location_name);

        -- If location does not exist, insert it
        IF current_location_id IS NULL AND current_location_name IS NOT NULL THEN
            INSERT INTO locations(name) VALUES (current_location_name) RETURNING location_id INTO current_location_id;
        END IF;

        -- CHECK THE VALUES JUST BEFORE INSERT
        -- RAISE EXCEPTION 'Checking record info: %, %, %, %, %', units_per_box, notes, current_product_id, current_location_id, status;
        RAISE LOG 'Checking record info: %, %, %, %, %, %', current_product_name, units_per_box, notes, current_product_id, current_location_id, status;
        RAISE LOG 'Checking count: %', number_of_boxes;

        FOR count IN 1 .. number_of_boxes 
        LOOP
            INSERT INTO cases (units_per_case, notes, product_id, location_id, status) VALUES (
                units_per_box,
                notes,
                current_product_id,
                current_location_id,
                status
            );
        END LOOP;

    END LOOP;

    RETURN 'Record(s) Imported';
END;
$$;


ALTER FUNCTION "public"."import_raw_product_list_batch"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_message"("message" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO import_logs (log_message) VALUES (message);
END;
$$;


ALTER FUNCTION "public"."log_message"("message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."name_filter"("name_string" "text", "select_function" "text") RETURNS SETOF "record"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    query text;
BEGIN
    -- Construct the dynamic query to execute the select function and filter by name
    query := format('SELECT * FROM %s AS inner_query WHERE inner_query.name ILIKE ''%%'' || %L || ''%%''', select_function, name_string);

    -- Execute the query and return the results
    RETURN QUERY EXECUTE query;
END;
$$;


ALTER FUNCTION "public"."name_filter"("name_string" "text", "select_function" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."name_filter_text"("name_string" "text", "select_function" "text") RETURNS "text"[]
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    query text;
    return_array text[][];
BEGIN
    -- Construct the dynamic query to execute the select function and filter by name
    query := format('SELECT * FROM %s AS inner_query WHERE inner_query.name ILIKE ''%%'' || %L || ''%%''', select_function, name_string);

    -- Execute the query and return the results
    EXECUTE query INTO return_array;
    RETURN return_array;
END;
$$;


ALTER FUNCTION "public"."name_filter_text"("name_string" "text", "select_function" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."old_import_raw_product_keys_from_csv"("csv_data" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    current_vendor_name text;
    current_vendor_id bigint;
    product_values text[];
    product_name text;  -- Declare product_name
    item_num text;      -- Declare item_num
    upc text;           -- Declare upc
    price_2023 numeric; -- Declare price_2023
    price_2022 numeric; -- Declare price_2022
    price_2021 numeric; -- Declare price_2021
    default_units_per_case integer; -- Declare default_units_per_case
    map numeric;       -- Declare map
    notes text;        -- Declare notes
BEGIN
RAISE NOTICE 'CSV DATA: %', csv_data;

    -- Loop through each product record in the array
    FOREACH product_values IN ARRAY csv_data
    LOOP
        -- Log the current record being processed
        RAISE NOTICE 'Processing record: %', product_values;

        -- Assign values based on their index in the array
        product_name := trim(product_values[1]); -- 1 index for Product Name
        item_num := trim(product_values[2]);    -- 2 index for item #
        upc := trim(product_values[3]);         -- 3 index for UPC
        current_vendor_name := trim(product_values[4]); -- 4 index for Vendor
        
        -- Attempt to parse prices
        price_2023 := NULLIF(trim(product_values[5]), '')::numeric; -- 5 index for 2023 Price
        price_2022 := NULLIF(trim(product_values[6]), '')::numeric; -- 6 index for 2022 AUG Price
        price_2021 := NULLIF(trim(product_values[7]), '')::numeric; -- 7 index for 2021 Price
        default_units_per_case := NULLIF(trim(product_values[8]), '')::integer; -- 8 index for Units Per Case
        map := NULLIF(trim(product_values[9]), '')::numeric; -- 9 index for MAP
        notes := trim(product_values[10]); -- 10 index for Notes

        -- Log parsed prices for debugging
        RAISE NOTICE 'Parsed prices - 2023: %, 2022: %, 2021: %', price_2023, price_2022, price_2021;

        -- Check if vendor exists
        SELECT v.vendor_id INTO current_vendor_id FROM vendors v WHERE v.vendor_name = current_vendor_name;

        -- If vendor does not exist, insert it
        IF current_vendor_id IS NULL AND current_vendor_name IS NOT NULL THEN
            INSERT INTO vendors (vendor_name) VALUES (current_vendor_name) RETURNING vendor_id INTO current_vendor_id;
        END IF;

        -- Validate required fields before inserting
        IF product_name IS NULL OR current_vendor_id IS NULL OR item_num IS NULL OR upc IS NULL THEN
            RAISE NOTICE 'Skipping row due to missing required fields: %', product_values;
            CONTINUE; -- Skip this iteration if required fields are missing
        END IF;

        -- Insert the product record
        INSERT INTO products (name, item_num, upc, vendor_id, price_2023, price_2022, price_2021, 
        default_units_per_case, map, notes) VALUES (
            product_name, 
            item_num, 
            upc, 
            current_vendor_id,
            price_2023, 
            price_2022, 
            price_2021, 
            default_units_per_case, 
            map, 
            notes
        );
    END LOOP;
END;$$;


ALTER FUNCTION "public"."old_import_raw_product_keys_from_csv"("csv_data" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."onproductlinecancel"("cancelled_product_id" bigint, "product_status" "text", "product_units_per_case" integer) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  cancelled_product_container cases;
  linked_po_recipe po_recipes;
  processed_box_to_update cases;

BEGIN
  UPDATE cases SET status = 'Cancelled' 
  WHERE product_id = cancelled_product_id AND status = product_status AND units_per_case = product_units_per_case
  RETURNING * INTO cancelled_product_container;

  SELECT * FROM po_recipes WHERE recipe_id = (
    SELECT recipe_id FROM recipe_elements 
    WHERE product_id = cancelled_product_container.product_id AND type = 'input') INTO linked_po_recipe;

END;
$$;


ALTER FUNCTION "public"."onproductlinecancel"("cancelled_product_id" bigint, "product_status" "text", "product_units_per_case" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."print_1darray"("data_array" "public"."processed_product_input"[]) RETURNS "public"."processed_product_input"
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
  row text[];
  element text;
BEGIN 
  RAISE LOG 'DATA ARRAY: %', data_array;

  -- Loop through each row in the 2D array
  -- FOREACH row IN ARRAY data_array
  -- LOOP
  --   -- Loop through each element in the row
  --   FOREACH element IN ARRAY row
  --   LOOP
  --     RAISE NOTICE 'ELEMENT: %', element;
  --   END LOOP;
  -- END LOOP;

  RETURN data_array;
END;
$$;


ALTER FUNCTION "public"."print_1darray"("data_array" "public"."processed_product_input"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."print_2darray"("data_array" "public"."processed_product_input"[]) RETURNS "public"."processed_product_input"
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
  row text[];
  element text;
BEGIN 
  RAISE LOG 'DATA ARRAY: %', data_array;

  -- Loop through each row in the 2D array
  -- FOREACH row IN ARRAY data_array
  -- LOOP
  --   -- Loop through each element in the row
  --   FOREACH element IN ARRAY row
  --   LOOP
  --     RAISE NOTICE 'ELEMENT: %', element;
  --   END LOOP;
  -- END LOOP;

  RETURN data_array;
END;
$$;


ALTER FUNCTION "public"."print_2darray"("data_array" "public"."processed_product_input"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."print_2darray_text"("data_array" "text"[]) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
  row text[];
  element text;
BEGIN 
  RAISE LOG 'DATA ARRAY: %', data_array;

  -- Loop through each row in the 2D array
  -- FOREACH row IN ARRAY data_array
  -- LOOP
  --   -- Loop through each element in the row
  --   FOREACH element IN ARRAY row
  --   LOOP
  --     RAISE NOTICE 'ELEMENT: %', element;
  --   END LOOP;
  -- END LOOP;

  RETURN data_array;
END;
$$;


ALTER FUNCTION "public"."print_2darray_text"("data_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."print_array"("data_array" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE 
  element text;
BEGIN 
RAISE LOG 'DATA ARRAY: %', data_array;
  FOREACH element IN ARRAY data_array
  LOOP
    --RAISE LOG 'ELEMENT: %', element;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."print_array"("data_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."product_filter"("column_name" "text", "filter_string" "text") RETURNS SETOF "public"."products"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    query text;
BEGIN
    -- Construct the dynamic query to filter by the specified column
    query := format('SELECT * FROM products WHERE %I ILIKE ''%%'' || %L || ''%%''', column_name, filter_string);

    -- Execute the query and return the results
    RETURN QUERY EXECUTE query;
END;
$$;


ALTER FUNCTION "public"."product_filter"("column_name" "text", "filter_string" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."testing"("csv_data" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
    current_vendor_name text;
    current_vendor_id bigint;
    product_values text[];
    product_name text;  -- Declare product_name
    item_num text;      -- Declare item_num
    upc text;           -- Declare upc
    price_2023 numeric; -- Declare price_2023
    price_2022 numeric; -- Declare price_2022
    price_2021 numeric; -- Declare price_2021
    default_units_per_case integer; -- Declare default_units_per_case
    map numeric;       -- Declare map
    notes text;        -- Declare notes
BEGIN
    -- Split the input CSV data into an array of values
    product_values := csv_data;

    -- Logging start of function
    raise log 'logging start of function call: (%)', product_values;


END;$$;


ALTER FUNCTION "public"."testing"("csv_data" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_case"("record_array" "text"[]) RETURNS "public"."cases"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_case cases;

BEGIN
  UPDATE cases SET 
    units_per_case = record_array[1]::integer, 
    date_received = record_array[2]::date, 
    notes = record_array[3], 
    product_id = record_array[4]::bigint, 
    location_id = record_array[5]::bigint, 
    status = record_array[6]
  WHERE case_id = record_array[7]::bigint
  RETURNING * INTO updated_case;

  RETURN updated_case;
END;
$$;


ALTER FUNCTION "public"."update_case"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_po_recipe"("record_array" "text"[]) RETURNS "public"."po_recipes"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_po_recipe po_recipes;

BEGIN
  UPDATE po_recipes SET
    purchase_order_id = record_array[1]::bigint,
    recipe_id = record_array[2]::bigint,
    qty = record_array[3]::integer
  WHERE po_recipe_id = record_array[4]::bigint
  RETURNING * INTO updated_po_recipe;

  RETURN updated_po_recipe;
END;
$$;


ALTER FUNCTION "public"."update_po_recipe"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchase_order"("record_array" "text"[]) RETURNS "public"."purchase_orders"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  updated_purchase_order purchase_orders;

BEGIN
  -- RAISE EXCEPTION 'PO Name: %, Status: %, Notes: %, Date Ordered: %, Date Received: %, Vendor ID: %, Discount: %, PO ID: %', record_array[1], record_array[2], record_array[3], record_array[4], record_array[5], record_array[6], record_array[7], record_array[8];
  UPDATE purchase_orders SET
    purchase_order_name = record_array[1], 
    status = record_array[2], 
    notes = record_array[3], 
    date_ordered = record_array[4]::timestamptz, 
    date_received = record_array[5]::timestamptz, 
    vendor_id = record_array[6]::bigint, 
    discount = record_array[7]::integer
  WHERE purchase_order_id = record_array[8]::bigint
  RETURNING * INTO updated_purchase_order;

  RETURN updated_purchase_order;
END;
$$;


ALTER FUNCTION "public"."update_purchase_order"("record_array" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_request"("record_array" "text"[]) RETURNS "public"."requests_to_process"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_request"("record_array" "text"[]) OWNER TO "postgres";


ALTER TABLE "public"."cases" ALTER COLUMN "case_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."cases_case_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "invoice_id" bigint NOT NULL,
    "invoice_name" "text",
    "total_cost" numeric,
    "purchase_order_id" bigint NOT NULL,
    "date_shipped" "date",
    "date_due" "date",
    "date_paid" "date",
    "card" numeric,
    "filed" boolean,
    "notes" "text"
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


ALTER TABLE "public"."invoices" ALTER COLUMN "invoice_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."invoices_invoice_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."locations" ALTER COLUMN "location_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."locations_location_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."picklist_elements" (
    "picklist_element_id" bigint NOT NULL,
    "picklist_id" bigint NOT NULL,
    "notes" "text",
    "request_id" bigint,
    "lane_location" "text"
);


ALTER TABLE "public"."picklist_elements" OWNER TO "postgres";


ALTER TABLE "public"."picklist_elements" ALTER COLUMN "picklist_element_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."picklist_elements_picklist_element_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."picklists" (
    "picklist_id" bigint NOT NULL,
    "label" "text" NOT NULL,
    "status" "text"
);


ALTER TABLE "public"."picklists" OWNER TO "postgres";


ALTER TABLE "public"."picklists" ALTER COLUMN "picklist_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."picklists_picklist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."po_recipes" ALTER COLUMN "po_recipe_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."po_recipes_po_recipe_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."products" ALTER COLUMN "product_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."products_product_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone,
    "username" "text",
    "full_name" "text",
    "avatar_url" "text",
    "website" "text",
    CONSTRAINT "username_length" CHECK (("char_length"("username") >= 3))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE "public"."purchase_orders" ALTER COLUMN "purchase_order_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."purchase_orders_purchase_order_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."recipe_elements" ALTER COLUMN "recipe_element_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."recipe_elements_recipe_element_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."recipes" ALTER COLUMN "recipe_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."recipes_recipe_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."requests_to_process" ALTER COLUMN "request_id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."requests_to_process_request_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "session_id" "text" NOT NULL,
    "expires" integer NOT NULL,
    "data" "text"
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


ALTER TABLE "public"."vendors" ALTER COLUMN "vendor_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."vendors_vendor_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."warehouses" (
    "warehouse_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "location_id" integer NOT NULL
);


ALTER TABLE "public"."warehouses" OWNER TO "postgres";


ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_pkey" PRIMARY KEY ("case_id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("location_id");



ALTER TABLE ONLY "public"."picklist_elements"
    ADD CONSTRAINT "picklist_elements_pkey" PRIMARY KEY ("picklist_element_id");



ALTER TABLE ONLY "public"."picklists"
    ADD CONSTRAINT "picklists_pkey" PRIMARY KEY ("picklist_id");



ALTER TABLE ONLY "public"."po_recipes"
    ADD CONSTRAINT "po_recipes_pkey" PRIMARY KEY ("po_recipe_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("purchase_order_id");



ALTER TABLE ONLY "public"."recipe_elements"
    ADD CONSTRAINT "recipe_elements_pkey" PRIMARY KEY ("recipe_element_id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("recipe_id");



ALTER TABLE ONLY "public"."requests_to_process"
    ADD CONSTRAINT "requests_to_process_pkey" PRIMARY KEY ("request_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("session_id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("vendor_id");



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_pkey" PRIMARY KEY ("warehouse_id");



CREATE INDEX "cases_location_id_idx" ON "public"."cases" USING "btree" ("location_id");



CREATE INDEX "cases_product_id_idx" ON "public"."cases" USING "btree" ("product_id");



CREATE INDEX "cases_purchase_order_id_idx" ON "public"."cases" USING "btree" ("purchase_order_id");



CREATE INDEX "picklist_elements_picklist_id_idx" ON "public"."picklist_elements" USING "btree" ("picklist_id");



CREATE INDEX "picklist_elements_request_id_idx" ON "public"."picklist_elements" USING "btree" ("request_id");



CREATE INDEX "po_recipes_purchase_order_id_idx" ON "public"."po_recipes" USING "btree" ("purchase_order_id");



CREATE INDEX "po_recipes_recipe_id_idx" ON "public"."po_recipes" USING "btree" ("recipe_id");



CREATE INDEX "products_vendor_idx" ON "public"."products" USING "btree" ("vendor_id");



CREATE INDEX "recipe_elements_product_id_idx" ON "public"."recipe_elements" USING "btree" ("product_id");



CREATE INDEX "recipe_elements_recipe_id_idx" ON "public"."recipe_elements" USING "btree" ("recipe_id");



CREATE INDEX "recipes_vendor_id_idx" ON "public"."recipes" USING "btree" ("vendor_id");



CREATE INDEX "requests_to_process_product_id_idx" ON "public"."requests_to_process" USING "btree" ("product_id");



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("invoice_id");



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_picklist_element_id_fkey" FOREIGN KEY ("picklist_element_id") REFERENCES "public"."picklist_elements"("picklist_element_id");



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "cases_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("purchase_order_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cases"
    ADD CONSTRAINT "fk_request_id" FOREIGN KEY ("request_id") REFERENCES "public"."requests_to_process"("request_id") ON DELETE SET DEFAULT;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("purchase_order_id");



ALTER TABLE ONLY "public"."picklist_elements"
    ADD CONSTRAINT "picklist_elements_picklist_id_fk" FOREIGN KEY ("picklist_id") REFERENCES "public"."picklists"("picklist_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."picklist_elements"
    ADD CONSTRAINT "picklist_elements_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests_to_process"("request_id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_recipes"
    ADD CONSTRAINT "po_recipes_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("purchase_order_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."po_recipes"
    ADD CONSTRAINT "po_recipes_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("recipe_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_vendor_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id");



ALTER TABLE ONLY "public"."recipe_elements"
    ADD CONSTRAINT "recipe_elements_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_elements"
    ADD CONSTRAINT "recipe_elements_recipe_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("recipe_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_vendor_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("vendor_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requests_to_process"
    ADD CONSTRAINT "requests_to_process_picklist_id_fkey" FOREIGN KEY ("picklist_id") REFERENCES "public"."picklists"("picklist_id");



ALTER TABLE ONLY "public"."requests_to_process"
    ADD CONSTRAINT "requests_to_process_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."requests_to_process"
    ADD CONSTRAINT "requests_to_process_purchase_order_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("purchase_order_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id");



CREATE POLICY "Public profiles are viewable by everyone." ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can insert their own profile." ON "public"."profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Users can update own profile." ON "public"."profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON FUNCTION "public"."_add_product_common_text"("product_data" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."_add_product_common_text"("product_data" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_add_product_common_text"("product_data" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."_edit_product_common_text"("product_record" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."_edit_product_common_text"("product_record" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_edit_product_common_text"("product_record" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."_get_purchase_order_ids_helper"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_get_purchase_order_ids_helper"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_get_purchase_order_ids_helper"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_foreign_keys_and_indexes"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_foreign_keys_and_indexes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_foreign_keys_and_indexes"() TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_location"("location_record" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."add_location"("location_record" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_location"("location_record" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."add_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_raw_product_composite"("product_record" "public"."products") TO "anon";
GRANT ALL ON FUNCTION "public"."add_raw_product_composite"("product_record" "public"."products") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_raw_product_composite"("product_record" "public"."products") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_raw_product_text"("product_record" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."add_raw_product_text"("product_record" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_raw_product_text"("product_record" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."bad_print"("data_array" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."bad_print"("data_array" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bad_print"("data_array" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_create_cases"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."batch_create_cases"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_create_cases"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_create_casesobj"("cases_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."batch_create_casesobj"("cases_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_create_casesobj"("cases_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_delete_products_by_id"("id_array" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."batch_delete_products_by_id"("id_array" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_delete_products_by_id"("id_array" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_create_cases"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_create_cases"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_create_cases"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_create_po_recipe"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_create_po_recipe"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_create_po_recipe"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_delete_cases"("id_array" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_delete_cases"("id_array" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_delete_cases"("id_array" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_update_case"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_update_case"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_update_case"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_update_case_v2"("case_array" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_update_case_v2"("case_array" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_update_case_v2"("case_array" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."cases" TO "anon";
GRANT ALL ON TABLE "public"."cases" TO "authenticated";
GRANT ALL ON TABLE "public"."cases" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_case"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_case"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_case"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_picklist"("picklist_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_picklist"("picklist_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_picklist"("picklist_data" "jsonb") TO "service_role";



GRANT ALL ON TABLE "public"."po_recipes" TO "anon";
GRANT ALL ON TABLE "public"."po_recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."po_recipes" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_po_recipe"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_po_recipe"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_po_recipe"("record_array" "text"[]) TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_purchase_order"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_purchase_order"("record_array" "text"[]) TO "service_role";



GRANT ALL ON TABLE "public"."requests_to_process" TO "anon";
GRANT ALL ON TABLE "public"."requests_to_process" TO "authenticated";
GRANT ALL ON TABLE "public"."requests_to_process" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_request"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_request"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_request"("record_array" "text"[]) TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_vendor"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_vendor"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_vendor"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_product_by_id"("record_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_product_by_id"("record_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_product_by_id"("record_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."dynamic_pagination"("select_function" "text", "page_number" integer, "total_records" integer, "order_field" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."dynamic_pagination"("select_function" "text", "page_number" integer, "total_records" integer, "order_field" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."dynamic_pagination"("select_function" "text", "page_number" integer, "total_records" integer, "order_field" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."edit_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."edit_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."edit_processed_product_text"("product_record" "text"[], "recipe_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."edit_raw_product_text"("product_record" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."edit_raw_product_text"("product_record" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."edit_raw_product_text"("product_record" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_product_keys"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_product_keys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_product_keys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_product_keys_with_vendors"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_product_keys_with_vendors"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_product_keys_with_vendors"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_boxes_and_cases"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_boxes_and_cases"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_boxes_and_cases"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cases_by_type"("processed" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_cases_by_type"("processed" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cases_by_type"("processed" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cases_by_type_for_po"("processed" boolean, "po_ids" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_cases_by_type_for_po"("processed" boolean, "po_ids" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cases_by_type_for_po"("processed" boolean, "po_ids" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_delivered_cases_by_type"("processed" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_delivered_cases_by_type"("processed" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_delivered_cases_by_type"("processed" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_locations"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_locations"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_locations"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_proc_product_keys"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_proc_product_keys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_proc_product_keys"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchase_orders"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchase_orders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchase_orders"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchase_orders_with_details"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchase_orders_with_details"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchase_orders_with_details"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchase_orders_with_details_3"("in_page" integer, "in_rows_per_page" integer, "in_filter_data" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchase_orders_with_details_3"("in_page" integer, "in_rows_per_page" integer, "in_filter_data" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchase_orders_with_details_3"("in_page" integer, "in_rows_per_page" integer, "in_filter_data" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_purchase_orders_with_detailsold"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_purchase_orders_with_detailsold"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_purchase_orders_with_detailsold"("in_page" integer, "in_rows_per_page" integer, "in_filter_field" "text", "in_filter_data" "text", "in_sort_field" "text", "in_sort_order" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_raw_product_keys"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_raw_product_keys"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_raw_product_keys"() TO "service_role";



GRANT ALL ON TABLE "public"."recipe_elements" TO "anon";
GRANT ALL ON TABLE "public"."recipe_elements" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_elements" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recipe_elements"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_recipe_elements"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recipe_elements"() TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recipes"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_recipes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recipes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recipes_and_elements_for_vendors"("ven_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recipes_and_elements_for_vendors"("ven_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recipes_and_elements_for_vendors"("ven_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_recipes_for_pos"("po_ids" bigint[]) TO "anon";
GRANT ALL ON FUNCTION "public"."get_recipes_for_pos"("po_ids" bigint[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_recipes_for_pos"("po_ids" bigint[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_count"("select_function" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_count"("select_function" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_count"("select_function" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_definitions_and_relationships"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_definitions_and_relationships"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_definitions_and_relationships"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_table_schema"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_table_schema"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_table_schema"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_vendors"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_vendors"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_vendors"() TO "service_role";



GRANT ALL ON FUNCTION "public"."global_filter"("filter_string" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."global_filter"("filter_string" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."global_filter"("filter_string" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."import_processed_product_keys"("product_name" "text", "date_added" timestamp with time zone, "do_we_carry" "text", "vendor_name" "text", "fnsku" "text", "asin" "text", "default_units_per_case" integer, "weight_lbs" integer, "box_type" "text", "box_cost" numeric, "process_time_per_unit_sec" integer, "meltable" "text", "products_needed_a" "text", "item_num_a" "text", "qty_1" integer, "products_needed_b" "text", "item_num_b" "text", "qty_2" integer, "products_needed_c" "text", "item_num_c" "text", "qty_3" integer, "products_needed_d" "text", "item_num_d" "text", "qty_4" integer, "products_needed_e" "text", "item_num_e" "text", "qty_5" integer, "products_needed_f" "text", "item_num_f" "text", "qty_6" integer, "bag_cost" numeric, "in_shipping_cost" numeric, "out_shipping_cost" numeric, "labor_cost" numeric, "item_cost" numeric, "unit_box_cost" numeric, "misc_cost" numeric, "amz_fees_cost" numeric, "storage_cost_30_day" numeric, "holiday_storage_cost" numeric, "total_cost" numeric, "total_holiday_cost" numeric, "notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."import_processed_product_keys"("product_name" "text", "date_added" timestamp with time zone, "do_we_carry" "text", "vendor_name" "text", "fnsku" "text", "asin" "text", "default_units_per_case" integer, "weight_lbs" integer, "box_type" "text", "box_cost" numeric, "process_time_per_unit_sec" integer, "meltable" "text", "products_needed_a" "text", "item_num_a" "text", "qty_1" integer, "products_needed_b" "text", "item_num_b" "text", "qty_2" integer, "products_needed_c" "text", "item_num_c" "text", "qty_3" integer, "products_needed_d" "text", "item_num_d" "text", "qty_4" integer, "products_needed_e" "text", "item_num_e" "text", "qty_5" integer, "products_needed_f" "text", "item_num_f" "text", "qty_6" integer, "bag_cost" numeric, "in_shipping_cost" numeric, "out_shipping_cost" numeric, "labor_cost" numeric, "item_cost" numeric, "unit_box_cost" numeric, "misc_cost" numeric, "amz_fees_cost" numeric, "storage_cost_30_day" numeric, "holiday_storage_cost" numeric, "total_cost" numeric, "total_holiday_cost" numeric, "notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_processed_product_keys"("product_name" "text", "date_added" timestamp with time zone, "do_we_carry" "text", "vendor_name" "text", "fnsku" "text", "asin" "text", "default_units_per_case" integer, "weight_lbs" integer, "box_type" "text", "box_cost" numeric, "process_time_per_unit_sec" integer, "meltable" "text", "products_needed_a" "text", "item_num_a" "text", "qty_1" integer, "products_needed_b" "text", "item_num_b" "text", "qty_2" integer, "products_needed_c" "text", "item_num_c" "text", "qty_3" integer, "products_needed_d" "text", "item_num_d" "text", "qty_4" integer, "products_needed_e" "text", "item_num_e" "text", "qty_5" integer, "products_needed_f" "text", "item_num_f" "text", "qty_6" integer, "bag_cost" numeric, "in_shipping_cost" numeric, "out_shipping_cost" numeric, "labor_cost" numeric, "item_cost" numeric, "unit_box_cost" numeric, "misc_cost" numeric, "amz_fees_cost" numeric, "storage_cost_30_day" numeric, "holiday_storage_cost" numeric, "total_cost" numeric, "total_holiday_cost" numeric, "notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."import_processed_product_keys_batch"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."import_processed_product_keys_batch"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_processed_product_keys_batch"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."import_processed_product_list_batch"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."import_processed_product_list_batch"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_processed_product_list_batch"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."import_raw_product_keys"("product_name" "text", "item_number" "text", "product_upc" "text", "vendor_name" "text", "the_2023_price" numeric, "the_2022_price" numeric, "the_2021_price" numeric, "unit_per_box" integer, "map_cost" numeric, "product_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."import_raw_product_keys"("product_name" "text", "item_number" "text", "product_upc" "text", "vendor_name" "text", "the_2023_price" numeric, "the_2022_price" numeric, "the_2021_price" numeric, "unit_per_box" integer, "map_cost" numeric, "product_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_raw_product_keys"("product_name" "text", "item_number" "text", "product_upc" "text", "vendor_name" "text", "the_2023_price" numeric, "the_2022_price" numeric, "the_2021_price" numeric, "unit_per_box" integer, "map_cost" numeric, "product_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."import_raw_product_keys_batch"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."import_raw_product_keys_batch"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_raw_product_keys_batch"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."import_raw_product_list_batch"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."import_raw_product_list_batch"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."import_raw_product_list_batch"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."log_message"("message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_message"("message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_message"("message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."name_filter"("name_string" "text", "select_function" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."name_filter"("name_string" "text", "select_function" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."name_filter"("name_string" "text", "select_function" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."name_filter_text"("name_string" "text", "select_function" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."name_filter_text"("name_string" "text", "select_function" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."name_filter_text"("name_string" "text", "select_function" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."old_import_raw_product_keys_from_csv"("csv_data" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."old_import_raw_product_keys_from_csv"("csv_data" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."old_import_raw_product_keys_from_csv"("csv_data" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."onproductlinecancel"("cancelled_product_id" bigint, "product_status" "text", "product_units_per_case" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."onproductlinecancel"("cancelled_product_id" bigint, "product_status" "text", "product_units_per_case" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."onproductlinecancel"("cancelled_product_id" bigint, "product_status" "text", "product_units_per_case" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."print_1darray"("data_array" "public"."processed_product_input"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."print_1darray"("data_array" "public"."processed_product_input"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."print_1darray"("data_array" "public"."processed_product_input"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."print_2darray"("data_array" "public"."processed_product_input"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."print_2darray"("data_array" "public"."processed_product_input"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."print_2darray"("data_array" "public"."processed_product_input"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."print_2darray_text"("data_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."print_2darray_text"("data_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."print_2darray_text"("data_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."print_array"("data_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."print_array"("data_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."print_array"("data_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."product_filter"("column_name" "text", "filter_string" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."product_filter"("column_name" "text", "filter_string" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."product_filter"("column_name" "text", "filter_string" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."testing"("csv_data" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."testing"("csv_data" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."testing"("csv_data" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_case"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_case"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_case"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_po_recipe"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_po_recipe"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_po_recipe"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchase_order"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchase_order"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchase_order"("record_array" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_request"("record_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_request"("record_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_request"("record_array" "text"[]) TO "service_role";



GRANT ALL ON SEQUENCE "public"."cases_case_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."cases_case_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."cases_case_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoices_invoice_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoices_invoice_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoices_invoice_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."locations_location_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."locations_location_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."locations_location_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."picklist_elements" TO "anon";
GRANT ALL ON TABLE "public"."picklist_elements" TO "authenticated";
GRANT ALL ON TABLE "public"."picklist_elements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."picklist_elements_picklist_element_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."picklist_elements_picklist_element_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."picklist_elements_picklist_element_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."picklists" TO "anon";
GRANT ALL ON TABLE "public"."picklists" TO "authenticated";
GRANT ALL ON TABLE "public"."picklists" TO "service_role";



GRANT ALL ON SEQUENCE "public"."picklists_picklist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."picklists_picklist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."picklists_picklist_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."po_recipes_po_recipe_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."po_recipes_po_recipe_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."po_recipes_po_recipe_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_product_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchase_orders_purchase_order_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchase_orders_purchase_order_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchase_orders_purchase_order_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."recipe_elements_recipe_element_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recipe_elements_recipe_element_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recipe_elements_recipe_element_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."recipes_recipe_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recipes_recipe_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recipes_recipe_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."requests_to_process_request_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."requests_to_process_request_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."requests_to_process_request_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."vendors_vendor_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."vendors_vendor_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."vendors_vendor_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."warehouses" TO "anon";
GRANT ALL ON TABLE "public"."warehouses" TO "authenticated";
GRANT ALL ON TABLE "public"."warehouses" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







