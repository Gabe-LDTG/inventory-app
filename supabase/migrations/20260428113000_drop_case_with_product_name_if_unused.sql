SET check_function_bodies = false;

DO $migration$
BEGIN
  BEGIN
    DROP TYPE public.case_with_product_name;
    RAISE NOTICE 'Dropped type public.case_with_product_name.';
  EXCEPTION
    WHEN dependent_objects_still_exist THEN
      RAISE NOTICE 'Did not drop public.case_with_product_name because dependencies still exist.';
  END;
END;
$migration$;
