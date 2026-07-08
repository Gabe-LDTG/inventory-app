-- A received field needed to be added to track both the total number expected and the current number received.
ALTER TABLE po_unit_allocations 
  ADD COLUMN received_units INTEGER DEFAULT 0;
