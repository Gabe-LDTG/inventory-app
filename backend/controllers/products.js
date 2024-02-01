//import functions from Product model class
import{
    getProducts,
    getProductsByType,
    getProductById,
    insertProduct,
    updateProductById,
    deleteProductById,
} from "../models/ProductModel.js";

import{
    getCases
} from "../models/CaseModel.js";

//get all products
export async function showProducts(req,res){
    try {
        const products = await getProducts();
        res.json(products);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//get processed products
export async function showProcProducts(req,res){
    try {
        const procProduct = await getProductsByType(true);
        res.json(procProduct);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//get unprocessed products
export async function showUnprocProducts(req,res){
    try {
        const unprocProduct = await getProductsByType(false);
        res.json(unprocProduct);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//get single product
export async function showProductsById(req,res){
    try {
        const productById = await getProductById(req.params.id);
        res.json(productById);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//create new product
export async function createProduct (req,res){
    try {
        const data=req.body;
        let insertedProduct = await insertProduct(data);
        
        res.json(insertedProduct);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

// Update Product 
export async function updateProduct (req, res){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedProduct = await updateProductById(data, id);
        res.json(updatedProduct);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

//Delete Product
export async function deleteProduct(req, res){
    try {
        const id = req.params.id;
        
        const cases = await getCases();

        for(let i = 0; i<cases.length; i++){

            if(cases[i].product_id == id){
                throw new Error('Product is in use');
            }
        }

        const deletedProduct = await deleteProductById(id);
        res.json(deletedProduct);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
}