-- This migration will add a new table called "po_unit_allocations" that will function as a bridge table between po_recipes and po_raw_lines. 
-- It will carry all of the unit allocations for incoming raw product, linking them to planned cases or sending them to various departments.
CREATE TABLE po_unit_allocations (
    po_unit_allocation_id BIGINT PRIMARY KEY,
    po_recipe_id BIGINT,
    po_raw_line_id BIGINT NOT NULL,
    allocated_units INTEGER NOT NULL,
    allocation_type TEXT NOT NULL, -- e.g., "fba_prep", "fbm", "store", "canceled"
    FOREIGN KEY (po_recipe_id) REFERENCES po_recipes(po_recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (po_raw_line_id) REFERENCES po_raw_lines(po_raw_line_id) ON DELETE CASCADE
);

-- Create an index on po_recipe_id and po_raw_line_id for faster lookups
CREATE INDEX idx_po_unit_allocations_po_recipe_id ON po_unit_allocations(po_recipe_id);
CREATE INDEX idx_po_unit_allocations_po_raw_line_id ON po_unit_allocations(po_raw_line_id);

ALTER TABLE po_unit_allocations ENABLE ROW LEVEL SECURITY;
-- Grant permissions to the appropriate roles
CREATE POLICY "Allocations are viewable by authenticated users."
ON public.po_unit_allocations
AS permissive
FOR select
TO authenticated
USING (true);

CREATE POLICY "Admin and Management can insert allocations."
ON public.po_unit_allocations
AS permissive
FOR insert
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.company_role = ANY (ARRAY['Admin','Management'])
  )
);

CREATE POLICY "Admin and Management can update allocations."
ON public.po_unit_allocations
AS permissive
FOR update
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.company_role = ANY (ARRAY['Admin','Management'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = (SELECT auth.uid())
      AND p.company_role = ANY (ARRAY['Admin','Management'])
  )
);