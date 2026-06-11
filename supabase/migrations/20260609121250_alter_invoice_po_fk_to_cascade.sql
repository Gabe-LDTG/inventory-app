-- This migrations alters the invoice foreign key to cascade on delete, since invoices are directly related to purchase orders. 
ALTER TABLE invoices
DROP CONSTRAINT invoices_purchase_order_id_fkey,
ADD CONSTRAINT invoices_purchase_order_id_fkey
  FOREIGN KEY (purchase_order_id)
  REFERENCES purchase_orders(purchase_order_id)
  ON DELETE CASCADE;