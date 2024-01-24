//import connection
import db from "../config/database.js";

const getProd = 'SELECT * FROM products';
const whereProc = 'WHERE (fnsku IS NOT NULL OR asin IS NOT NULL) AND (upc IS NULL OR upc = 0)';
const whereUnproc = 'WHERE (fnsku IS NULL AND asin IS NULL) OR (fnsku = "" AND asin = "")';
//WHERE upc IS NOT NULL AND 

//get all products
export const getProducts=(result)=>{
    db.query(getProd,(err,results)=>{
        if(err){
            console.log(err);
            result(err,null);
        }else{
            result(null, results);
        }
    });
}

//get processed products (has fnsku and/or asin)
export const getProcProducts=(result)=>{
    db.query("SELECT * FROM products "+whereProc,(err,results)=>{
        if(err){
            console.log(err);
            result(err,null);
        }else{
            result(null, results);
        }
    });
}

//get unprocessed products (has upc and/or no fnsku)
export const getUnprocProducts=(result)=>{
    db.query("SELECT * FROM products "+whereUnproc,(err,results)=>{
        if(err){
            console.log(err);
            result(err,null);
        }else{
            result(null, results);
        }
    });
}

//get single produt
export const getProductById = (id,result)=>{
    db.query(
        "SELECT * FROM products WHERE id = ?",
        [id],
        (err,results) => {
            if (err) {
                console.log(err);
                result(err, null);
            } else {
                result(null, results);
            }
        }
    );
};

//insert product to database
export const insertProduct=(data,result)=>{
    db.query("INSERT INTO products (name, asin, fnsku, upc, notes) VALUES (?, ?, ?, ?, ?)",[data.name, data.asin, data.fnsku, data.upc, data.notes],(err,results)=>{
        if (err) {
            console.log(err);
            result(err, null);
        } else {
            console.log(results);
            result(null, results);
        }
    });
}

// Update Product to Database
export const updateProductById = (data, id, result) => {
    //console.log("_________________________________________________")
    //console.log(data);
    db.query("UPDATE products SET name = ?, asin = ?, fnsku = ?, upc = ?, notes = ? WHERE id = ?",[data.name, data.asin, data.fnsku, data.upc, data.notes, id],(err,results)=>{
        if (err) {
            console.log(err);
            result(err, null);
        } else {
            result(null, results);
        }
    });
}

//Delete Product from Database
export const deleteProductById = (id, result) => {
    db.query("DELETE FROM products WHERE id = ?", [id], (err,results) => {
        if(err) {
            console.log(err);
            result(err, null);
        } else {
            result(null, results);
        }
    });
}