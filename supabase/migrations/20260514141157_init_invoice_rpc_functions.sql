create or replace function public.create_invoice(invoice_data jsonb)
returns public.invoices
language plpgsql
as $$
declare
	new_invoice public.invoices;
begin
	insert into public.invoices (
		invoice_name,
		purchase_order_id,
		total_cost,
		date_shipped,
		date_due,
		date_paid,
		card,
		filed,
		notes
	)
	values (
		nullif(invoice_data->>'invoice_name', ''),
		(invoice_data->>'purchase_order_id')::bigint,
		nullif(invoice_data->>'total_cost', '')::numeric,
		nullif(invoice_data->>'date_shipped', '')::date,
		nullif(invoice_data->>'date_due', '')::date,
		nullif(invoice_data->>'date_paid', '')::date,
		nullif(invoice_data->>'card', '')::numeric,
		nullif(invoice_data->>'filed', '')::boolean,
		nullif(invoice_data->>'notes', '')
	)
	returning * into new_invoice;

	return new_invoice;
end;
$$;

grant all on function public.create_invoice(jsonb) to authenticated;
grant all on function public.create_invoice(jsonb) to service_role;

create or replace function public.create_invoice_with_raw_lines(invoice_data jsonb, raw_line_ids bigint[])
returns public.invoices
language plpgsql
as $$
declare
    new_invoice public.invoices;
begin
    -- Insert the new invoice
    insert into public.invoices (
        invoice_name,
        purchase_order_id,
        total_cost,
        date_shipped,
        date_due,
        date_paid,
        card,
        filed,
        notes
    )
    values (
        nullif(invoice_data->>'invoice_name', ''),
        (invoice_data->>'purchase_order_id')::bigint,
        nullif(invoice_data->>'total_cost', '')::numeric,
        nullif(invoice_data->>'date_shipped', '')::date,
        nullif(invoice_data->>'date_due', '')::date,
        nullif(invoice_data->>'date_paid', '')::date,
        nullif(invoice_data->>'card', '')::numeric,
        nullif(invoice_data->>'filed', '')::boolean,
        nullif(invoice_data->>'notes', '')
    )
    returning * into new_invoice;

    -- Link raw line items to the new invoice
    update public.po_raw_lines
    set invoice_id = new_invoice.invoice_id
    where po_raw_line_id = any(raw_line_ids);

    return new_invoice;
end;
$$;

grant all on function public.create_invoice_with_raw_lines(jsonb, bigint[]) to authenticated;
grant all on function public.create_invoice_with_raw_lines(jsonb, bigint[]) to service_role;

create or replace function public.update_invoice(invoice_data jsonb)
returns public.invoices
language plpgsql
as $$
declare
	updated_invoice public.invoices;
begin
	update public.invoices
	set
		invoice_name = nullif(invoice_data->>'invoice_name', ''),
		purchase_order_id = (invoice_data->>'purchase_order_id')::bigint,
		total_cost = nullif(invoice_data->>'total_cost', '')::numeric,
		date_shipped = nullif(invoice_data->>'date_shipped', '')::date,
		date_due = nullif(invoice_data->>'date_due', '')::date,
		date_paid = nullif(invoice_data->>'date_paid', '')::date,
		card = nullif(invoice_data->>'card', '')::numeric,
		filed = nullif(invoice_data->>'filed', '')::boolean,
		notes = nullif(invoice_data->>'notes', '')
	where invoice_id = (invoice_data->>'invoice_id')::bigint
	returning * into updated_invoice;

	return updated_invoice;
end;
$$;

grant all on function public.update_invoice(jsonb) to authenticated;
grant all on function public.update_invoice(jsonb) to service_role;

