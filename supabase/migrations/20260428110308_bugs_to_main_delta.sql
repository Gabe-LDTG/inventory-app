SET check_function_bodies = false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_processed boolean;