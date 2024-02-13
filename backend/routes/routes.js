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
} from "../controllers/authentication.js";

//init express router
const router=express.Router();

//USERS------------------------------------------------------------------------------
//get all users
router.get("/users",showUsers);

//create New User
router.post('/users/create', createUser);

//validates a password
router.post('/users/validate', validate)

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

//ROUTER--------------------------------------------------------------------------
//export default router
export default router;