ALTER TABLE po_unit_allocations 
ADD CONSTRAINT unique_raw_line_and_type UNIQUE (po_raw_line_id, allocation_type);
