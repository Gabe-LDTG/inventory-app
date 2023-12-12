//import express
import express from "express";

//import functions from controller
import {
    showProducts,
    showProductsById,
    createProduct,
    updateProduct,
    deleteProduct,
} from "../controllers/products.js";

import {
    showCases, 
    showProcCases, 
    showUnprocCases,
    createCase,
    deleteCase,
} from "../controllers/cases.js";

//init express router
const router=express.Router();

//PRODUCTS---------------------------------------------------------------------------
//get all product
router.get("/products",showProducts);

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

//Get Processed Cases
router.get("/cases/processed",showProcCases);

//Get Unprocessed Cases
router.get("/cases/unprocessed",showUnprocCases);

//Create Processed Cases
router.post("/cases/create", createCase);

//Delete Cases
router.delete('/cases/:id',deleteCase);

//ROUTER--------------------------------------------------------------------------
//export default router
export default router;