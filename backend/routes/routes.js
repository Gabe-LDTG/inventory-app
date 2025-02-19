//import express
import express from "express";

//import functions from controller
import {
    showProducts,
    showProcProducts,
    showUnprocProducts,
    showProductsById,
    createProduct,
    updateProduct,
    deleteProduct,
    batchInsert,
    batchInsertRaw,
    batchDelete,
} from "../controllers/products.js";

import {
    showCases, 
    showCasesIds,
    showProcCases, 
    showUnprocCases,
    showDeliveredUnprocCases,
    createCase,
    bulkCreateCase,
    updateCase,
    bulkUpdateCase,
    deleteCase,
    batchDeleteCases,
    showDeliveredProcCases,
} from "../controllers/cases.js";

import {
    showUsers,
    createUser,
    validate,
    checkSessionUser,
    endSession,
} from "../controllers/authentication.js";

import {
    showPurchaseOrders,
    createPurchaseOrder,
    deletePurchaseOrder,
    updatePurchaseOrder,
    showPurchaseOrderRecipes,
    createPurchaseOrderRecipe,
    deletePurchaseOrderRecipe,
    updatePurchaseOrderRecipe,
    batchInsertPoRecEl,
} from "../controllers/purchase_orders.js";

import {
    showRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    showRecipeElements,
    createRecipeElement,
    updateRecipeElement,
    deleteRecipeElement,
    batchInsertRecEl,
} from "../controllers/recipes.js";

import {
    showVendors,
    createVendor,
    updateVendor
} from "../controllers/vendors.js";

import {
    showLocations,
    createLocation,
    updateLocation
} from "../controllers/locations.js";

import {
    showRequests,
    createRequestToProcess,
    deleteRequest,
    updateRequest,
    batchInsertRequests2P,
    batchUpdateRequests2P
} from "../controllers/requests.js";

import {
    showPicklists,
    createPicklist,
    deletePicklist,
    updatePicklist,
    showPicklistElements,
    createPicklistElement,
    deletePicklistElement,
    updatePicklistElement,
    batchInsertPicklistElements,
    batchUpdatePicklistElements
} from "../controllers/picklists.js";

//init express router
const router=express.Router();

//USERS------------------------------------------------------------------------------
//get all users
router.get("/users",showUsers);

//create New User
router.post('/users/create', createUser);

//validates a password
router.post('/users/validate', validate);

//get the user with the Session Id
router.get('/sessionUser', checkSessionUser);

//log out the user
router.post('/logout', endSession);

//IMPORT PRODUCTS


//PRODUCTS---------------------------------------------------------------------------
//get all product
router.get("/products",showProducts);

//get all product
router.get("/products/processed",showProcProducts);

//get all product
router.get("/products/unprocessed",showUnprocProducts);

//get single product
router.get("/products/:id",showProductsById);

//Create New Product
router.post('/products/create', createProduct);

//Update Product
router.put('/products/:id', updateProduct);

//Delete Product
router.delete('/products/:id', deleteProduct);

//Batch Insert
router.post('/products/batchInsert', batchInsert);

//Batch Insert
router.post('/products/batchInsertRaw', batchInsertRaw);

//Batch Delete
router.post('/products/batchDelete', batchDelete);

//CASES---------------------------------------------------------------------------
//Get All Cases
router.get("/cases",showCases);

router.get("/cases/id", showCasesIds);

//Get Processed Cases
router.get("/cases/processed",showProcCases);

//Get Unprocessed Cases
router.get("/cases/unprocessed",showUnprocCases);

//Get Unprocessed Delivered Cases
router.get("/cases/unprocessed/delivered", showDeliveredUnprocCases);

//Get Processed Delivered Cases
router.get("/cases/processed/delivered",showDeliveredProcCases);

//Create Processed Cases
router.post("/cases/create", createCase);

//Create Bulk Cases
router.post("/cases/bulk", bulkCreateCase);

//Update Case
router.put('/cases/:id', updateCase);

//Bulk Update Cases
router.post('/cases/bulkUpdate', bulkUpdateCase);

//Delete Cases
router.delete('/cases/:id',deleteCase);

//Batch Delete
router.post('/cases/batchDelete', batchDeleteCases);

//PURCHASE ORDERS-----------------------------------------------------------------
//Get Purchase orders
router.get("/purchaseOrders", showPurchaseOrders);

//Create a Purchase order
router.post("/purchaseOrders/create", createPurchaseOrder);

//Edit a Purchase order
router.put("/purchaseOrders/:id", updatePurchaseOrder);

//Delete a Purchase order
router.delete("purchaseOrders/:id", deletePurchaseOrder);

//Get Purchase Order Recipes
router.get("/purchaseOrderRecipes", showPurchaseOrderRecipes);

//Create a Purchase Order Recipe
router.post("/purchaseOrderRecipes/create", createPurchaseOrderRecipe);

//Edit a Purchase Order Recipe
router.put("/purchaseOrderRecipes/:id", updatePurchaseOrderRecipe);

//Delete a Purchase Order Recipe
router.delete("/purchaseOrderRecipes/:id", deletePurchaseOrderRecipe);

//Batch insert Purchase Order Recipes
router.post("/purchaseOrderRecipes/bulk", batchInsertPoRecEl);

//RECIPES-------------------------------------------------------------------------
//Get Recipes
router.get("/recipes", showRecipes);

//Create a Recipe
router.post("/recipes/create", createRecipe);

//Edit a Recipe
router.put("/recipes/:id", updateRecipe);

//Delete a Recipe
router.delete("/recipes/:id", deleteRecipe);

//Get Recipe Elements
router.get("/recipeElements", showRecipeElements);

//Create a Recipe Element
router.post("/recipeElements/create", createRecipeElement);

//Edit a Recipe Element
router.put("/recipeElements/:id", updateRecipeElement);

//Delete a Recipe Element
router.delete("/recipeElements/:id", deleteRecipeElement);

//Batch Insert Recipe Elements
router.post('/recipeElements/batchInsert', batchInsertRecEl);

//VENDORS-------------------------------------------------------------------------
//Get Vendors
router.get("/vendors", showVendors);

//Create a Vendor
router.post("/vendors/create", createVendor);

//Update a Vendor
router.put("/vendors/:id", updateVendor);

//LOCATIONS-----------------------------------------------------------------------
//Get Locations
router.get("/locations", showLocations);

//Create a Location
router.post("/locations/create", createLocation);

//Update a Location
router.put("/locations/:id", updateLocation);

//REQUESTS TO PROCESS-------------------------------------------------------------
// Get requests
router.get("/requests", showRequests);

// Create a request
router.post("/requests/create", createRequestToProcess);

// Update a request
router.put("/requests/:id", updateRequest);

//Delete a request
router.delete("/requests/:id", deleteRequest);

// Batch insert requests into the database
router.post("/requests/batchInsert", batchInsertRequests2P);

// Batch update requests in the database
router.post("/requests/batchUpdate", batchUpdateRequests2P);

//PICKLISTS-----------------------------------------------------------------------
// Get picklists
router.get("/picklists", showPicklists);

// Create a picklist
router.post("/picklists/create", createPicklist);

// Update a picklist
router.put("/picklists/:id", updatePicklist);

// Delete a picklist
router.delete("/picklists/:id", deletePicklist);

// Get picklist elements
router.get("/picklistElements", showPicklistElements);

// Create a picklist element
router.post("/picklistElements/create", createPicklistElement);

// Update a picklist element
router.put("/picklistElements/:id", updatePicklistElement);

// Delete a picklist element
router.delete("/picklistElements/:id", deletePicklistElement);

// Batch insert picklist elements
router.post("/picklistElements/batchInsert", batchInsertPicklistElements)

// Batch update picklist elements
router.post("/picklistElements/batchUpdate", batchUpdatePicklistElements);


//ROUTER--------------------------------------------------------------------------
//export default router
export default router;