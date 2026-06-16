-- This migration will alter the recipe table to add a column tracking the output product for the recipe. It will also add those product ids to the new column. Deleting old recipe elements will be handled in a later migration, as we want to keep the old data for now.
ALTER TABLE recipes 
ADD COLUMN output_product_id bigint,
ALTER COLUMN vendor_id TYPE bigint,
ADD CONSTRAINT fk_output_product
FOREIGN KEY (output_product_id) REFERENCES products(product_id) ON DELETE CASCADE;

UPDATE recipes r
SET output_product_id = re.product_id
FROM recipe_elements re
WHERE r.recipe_id = re.recipe_id
  AND re.type = 'output';
