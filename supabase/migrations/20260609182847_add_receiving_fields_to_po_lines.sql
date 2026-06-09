-- This migration will add three new fields to the po_lines table: store, fbm, and fba_prep. These fields will be used to track the units going to the three respective areas of the warehouse.
alter table po_raw_lines
add column store numeric default 0,
add column fbm numeric default 0,
add column fba_prep numeric default 0;