SET check_function_bodies = false;

-- Stabilize RPC output contract by removing dependence on composite type attribute order.
DROP FUNCTION IF EXISTS public.get_cases_by_type(boolean);
CREATE FUNCTION public.get_cases_by_type(processed boolean)
RETURNS TABLE(
  case_id bigint,
  units_per_case integer,
  date_received date,
  notes text,
  product_id bigint,
  location_id bigint,
  status text,
  purchase_order_id bigint,
  request_id bigint,
  product_name text
)
LANGUAGE plpgsql
AS $function$
BEGIN
  IF processed = TRUE THEN
    RETURN QUERY
    SELECT
      c.case_id,
      c.units_per_case,
      c.date_received,
      c.notes,
      c.product_id,
      c.location_id,
      c.status,
      c.purchase_order_id,
      c.request_id,
      p.name
    FROM public.cases c
    INNER JOIN public.products p ON c.product_id = p.product_id
    WHERE (COALESCE(NULLIF(p.fnsku, ''), NULLIF(p.asin, '')) IS NOT NULL);
  ELSE
    RETURN QUERY
    SELECT
      c.case_id,
      c.units_per_case,
      c.date_received,
      c.notes,
      c.product_id,
      c.location_id,
      c.status,
      c.purchase_order_id,
      c.request_id,
      p.name
    FROM public.cases c
    INNER JOIN public.products p ON c.product_id = p.product_id
    WHERE (COALESCE(NULLIF(p.fnsku, ''), NULLIF(p.asin, '')) IS NULL);
  END IF;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_cases_by_type_for_po(boolean, bigint[]);
CREATE FUNCTION public.get_cases_by_type_for_po(processed boolean, po_ids bigint[])
RETURNS TABLE(
  case_id bigint,
  units_per_case integer,
  date_received date,
  notes text,
  product_id bigint,
  location_id bigint,
  status text,
  purchase_order_id bigint,
  request_id bigint,
  product_name text
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  IF processed = TRUE THEN
    RETURN QUERY
    SELECT
      c.case_id,
      c.units_per_case,
      c.date_received,
      c.notes,
      c.product_id,
      c.location_id,
      c.status,
      c.purchase_order_id,
      c.request_id,
      p.name
    FROM public.cases c
    INNER JOIN public.products p ON c.product_id = p.product_id
    WHERE (COALESCE(NULLIF(p.fnsku, ''), NULLIF(p.asin, '')) IS NOT NULL)
      AND (po_ids IS NULL OR array_length(po_ids, 1) = 0 OR c.purchase_order_id = ANY(po_ids));
  ELSE
    RETURN QUERY
    SELECT
      c.case_id,
      c.units_per_case,
      c.date_received,
      c.notes,
      c.product_id,
      c.location_id,
      c.status,
      c.purchase_order_id,
      c.request_id,
      p.name
    FROM public.cases c
    INNER JOIN public.products p ON c.product_id = p.product_id
    WHERE (COALESCE(NULLIF(p.fnsku, ''), NULLIF(p.asin, '')) IS NULL)
      AND (po_ids IS NULL OR array_length(po_ids, 1) = 0 OR c.purchase_order_id = ANY(po_ids));
  END IF;
END;
$function$;

DROP FUNCTION IF EXISTS public.get_delivered_cases_by_type(boolean);
CREATE FUNCTION public.get_delivered_cases_by_type(processed boolean)
RETURNS TABLE(
  case_id bigint,
  units_per_case integer,
  date_received date,
  notes text,
  product_id bigint,
  location_id bigint,
  status text,
  purchase_order_id bigint,
  request_id bigint,
  product_name text
)
LANGUAGE plpgsql
AS $function$
BEGIN
  IF processed = TRUE THEN
    RETURN QUERY
    SELECT
      c.case_id,
      c.units_per_case,
      c.date_received,
      c.notes,
      c.product_id,
      c.location_id,
      c.status,
      c.purchase_order_id,
      c.request_id,
      p.name
    FROM public.cases c
    INNER JOIN public.products p ON c.product_id = p.product_id
    WHERE (COALESCE(NULLIF(p.fnsku, ''), NULLIF(p.asin, '')) IS NOT NULL)
      AND (
        c.status IS NULL OR
        c.status NOT IN ('Draft', 'Submitted', 'Ordered', 'Inbound', 'BO', 'Back Ordered')
      );
  ELSE
    RETURN QUERY
    SELECT
      c.case_id,
      c.units_per_case,
      c.date_received,
      c.notes,
      c.product_id,
      c.location_id,
      c.status,
      c.purchase_order_id,
      c.request_id,
      p.name
    FROM public.cases c
    INNER JOIN public.products p ON c.product_id = p.product_id
    WHERE (COALESCE(NULLIF(p.fnsku, ''), NULLIF(p.asin, '')) IS NULL)
      AND (
        c.status IS NULL OR
        c.status NOT IN ('Draft', 'Submitted', 'Ordered', 'Inbound', 'BO', 'Back Ordered')
      );
  END IF;
END;
$function$;

GRANT ALL ON FUNCTION public.get_cases_by_type(boolean) TO anon;
GRANT ALL ON FUNCTION public.get_cases_by_type(boolean) TO authenticated;
GRANT ALL ON FUNCTION public.get_cases_by_type(boolean) TO service_role;

GRANT ALL ON FUNCTION public.get_cases_by_type_for_po(boolean, bigint[]) TO anon;
GRANT ALL ON FUNCTION public.get_cases_by_type_for_po(boolean, bigint[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_cases_by_type_for_po(boolean, bigint[]) TO service_role;

GRANT ALL ON FUNCTION public.get_delivered_cases_by_type(boolean) TO anon;
GRANT ALL ON FUNCTION public.get_delivered_cases_by_type(boolean) TO authenticated;
GRANT ALL ON FUNCTION public.get_delivered_cases_by_type(boolean) TO service_role;