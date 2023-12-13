//import functions from Product model class
import{
    getProducts,
    getProcProducts,
    getUnprocProducts,
    getProductById,
    insertProduct,
    updateProductById,
    deleteProductById,
} from "../models/ProductModel.js";

//get all products
export const showProducts = (req,res) => {
    getProducts((err,results) => {
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
};

//get processed products
export const showProcProducts = (req,res) => {
    getProcProducts((err,results) => {
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
};

//get unprocessed products
export const showUnprocProducts = (req,res) => {
    getUnprocProducts((err,results) => {
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
};

//get single product
export const showProductsById = (req,res) => {
    getProductById(req.params.id,(err,results)=>{
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
};

//create new product
export const createProduct = (req,res) => {
    const data=req.body;
    insertProduct(data, (err,results)=> {
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
};

// Update Product 
export const updateProduct = (req, res) => {
    const data = req.body;
    const id = req.params.id;
    updateProductById(data, id, (err, results) => {
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
}

//Delete Product
export const deleteProduct = (req, res) => {
    const id = req.params.id;
    deleteProductById(id, (err, results) =>{
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
}