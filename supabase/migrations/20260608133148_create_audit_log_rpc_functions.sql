CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    pk_column_name TEXT;
    record_id_val BIGINT;
    target_record JSONB;
BEGIN
    -- 1. Dynamically find the primary key column name for the current table
    SELECT a.attname INTO pk_column_name
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = TG_RELID AND i.indisprimary;

    -- 2. Grab the appropriate data payload based on the operation type
    IF TG_OP = 'DELETE' THEN
        target_record := to_jsonb(OLD);
    ELSE
        target_record := to_jsonb(NEW);
    END IF;

    -- 3. Extract the actual UUID value from that dynamic column name
    record_id_val := (target_record ->> pk_column_name)::BIGINT;

    -- 4. Write to the central audit log table
    INSERT INTO public.audit_logs (table_name, action, record_id, old_data, new_data, changed_by)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        record_id_val,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );

    -- Return statement adjusted based on the operation state
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE TRIGGER tr_audit_purchase_orders
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_cases
AFTER INSERT OR UPDATE OR DELETE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_locations
AFTER INSERT OR UPDATE OR DELETE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_picklist_elements
AFTER INSERT OR UPDATE OR DELETE ON public.picklist_elements
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_picklists
AFTER INSERT OR UPDATE OR DELETE ON public.picklists
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_po_raw_lines
AFTER INSERT OR UPDATE OR DELETE ON public.po_raw_lines
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_po_recipes
AFTER INSERT OR UPDATE OR DELETE ON public.po_recipes
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_recipe_elements
AFTER INSERT OR UPDATE OR DELETE ON public.recipe_elements
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_recipes
AFTER INSERT OR UPDATE OR DELETE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_requests_to_process
AFTER INSERT OR UPDATE OR DELETE ON public.requests_to_process
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_vendors
AFTER INSERT OR UPDATE OR DELETE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER tr_audit_warehouses
AFTER INSERT OR UPDATE OR DELETE ON public.warehouses
FOR EACH ROW
EXECUTE FUNCTION public.process_audit_log();