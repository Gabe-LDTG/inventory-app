-- Add a json object field called storage_locations to the allocations table. This will track all storage locations in the order until the user selects to add those allocations to the inventory.
ALTER TABLE po_unit_allocations
ADD COLUMN storage_locations JSONB;
