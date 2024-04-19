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
    batchDelete,
} from "../controllers/products.js";

import {
    showCases, 
    showCasesIds,
    showProcCases, 
    showUnprocCases,
    createCase,
    updateCase,
    deleteCase,
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
} from "../controllers/purchase_orders.js";

import {
    showRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
} from "../controllers/recipes.js";

import {
    showVendors,
    createVendor,
    updateVendor
} from "../controllers/vendors.js"

import {
    showLocations,
    createLocation,
    updateLocation
} from "../controllers/locations.js"

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

//Create Processed Cases
router.post("/cases/create", createCase);

//Update Case
router.put('/cases/:id', updateCase);

//Delete Cases
router.delete('/cases/:id',deleteCase);

//PURCHASE ORDERS-----------------------------------------------------------------
//Get Purchase orders
router.get("/purchaseOrders", showPurchaseOrders);

//Create a Purchase order
router.post("/purchaseOrders/create", createPurchaseOrder);

//Edit a Purchase order
router.put("/purchaseOrders/:id", updatePurchaseOrder);

//Delete a Purchase order
router.delete("purchaseOrders/:id", deletePurchaseOrder);

//RECIPES-------------------------------------------------------------------------
//Get Recipes
router.get("/recipes", showRecipes);

//Create a Recipe
router.post("/recipes/create", createRecipe);

//Edit a Recipe
router.put("/recipes/:id", updateRecipe);

//Delete a Recipe
router.delete("/recipes/:id", deleteRecipe);

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


//ROUTER--------------------------------------------------------------------------
//export default router
export default router;