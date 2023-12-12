//import connection
import db from "../config/database.js";

//get all products
export const getProducts=(result)=>{
    db.query("SELECT * FROM products",(err,results)=>{
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
    console.log("_________________________________________________")
    console.log(data);
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