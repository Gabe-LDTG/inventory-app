# TODO
MISC
- VITE environmental variables [x]

- Supabase db functions [x]

- Once the unprocessed and processed box pages done, host an alpha version for ben and katelin to look at while finishing up the other pages [x]

- Move the grabbing of the arrays of records to edit to the backend (IE send the one record with an amount, have the database grab record(s) base on matching field, loop through based on the amount field, and update the records, all in a database function) [x]

- Work on DNS with ben []

- Host dev on netlify/github pages []

- Convert bulk update forms into cell edits that autosave []

- Add a price table that holds the fields [price_start_date, price_end_date, price]. For the current price, grab the 
price that has no end date []

-Figure out the migration process (Prod A and Prod B) []

-Look into Bulma for CSS design []

LOGIN
- Supabase authentication [x]

- Find a way to alert a user of their login while pushing them to the home page []

- Make sure users cannot create an account with the same email twice []

- Add error messages below username and password to help the user understand why they can't log in []

PRODUCTS: 
- Look into making the product array into an object with the appropriate fields [x]

- Make sure the newly added product records get added to the inventory without the user having to refresh [x]
  
- Add a private common function for creating both raw and processed product keys [x]

- Display vendor and item num in product key page [x]

PURCHASE ORDERS: 
- Separate boxes by notes (incase Products are being ordered for FBM) [x]

- Allow the user the ability to add and remove items from the purchase order through any phase []
  
- Display item number in PO [x]

- Switch UPC for item num in recipe select [x]

- Place the totalChecking into its own function [x]

- Fix the bug where a single partial box cannot be edited because the "units per box" field will always match the 
  "totals" field [x]

- Figure out why products added after PO creation are not able to be received [x] (the box status was not checke 
 in the if, unless it was Draft)

- Clean up the receiving Dialog []

REQUEST TO PROCESS:
- Automatically populate the request to process page when a purchase order's status is at least "Ordered" []

- Create cases to process in this page []

- Add a drop down so that users can see all available raw products to be used for the processed product []

- When looping through all of the reqRecipes, search for cases by product type, and purchase order. If they exist, display them, if not, show the recipe instead []

- Autofill the priority field by the deadline field [x]
Equation from excel =IFS(G50="","TBD",G50<=TODAY(),"0 MUST GO OUT TODAY",And(today()+1<=G50,G50<=TODAY()+5),"1 This Week",AND(TODAY()+6<=G50,G50<=TODAY()+14),"2 Weeks",AND(TODAY()+15<=G50,G50<=TODAY()+21),"3 Weeks",AND(TODAY()+22<=G50,G50<=TODAY()+31),"4 This Month",AND(TODAY()+32<=G50,G50<=TODAY()+60),"5 Next Month",TODAY()+61<=G50,"6 Several Months")

- When a user selects a product, filter to only purchase orders with that product, and vice versa [x]

- Add pick list functionality to requests that are not tied a purchase order []
