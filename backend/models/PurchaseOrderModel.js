//import connection
import db from "../config/database.js";

const getPurOrd = 'SELECT * FROM purchase_orders';
const getPurOrdRecs = 'SELECT * FROM po_recipes'

//get all purchase orders
export async function getPurchaseOrders(){
    return db.query(getPurOrd).then(([results, fields])=>results);
}

//insert purchase order into database
export async function insertPurchaseOrder(data){
    let info = [
        data.purchase_order_name, 
        data.status, 
        data.notes, 
        data.date_ordered, 
        data.date_received, 
        data.vendor_id, 
    ];
    let query = "INSERT INTO purchase_orders (purchase_order_name, status, notes, date_ordered, date_received, vendor_id) VALUES (?, ?, ?, ?, ?, ?);";
    db.query(query, info).then(([results, fields])=>results);
    return db.query("SELECT LAST_INSERT_ID()").then(([results, fields])=>results);
}

//delete purchase order from database
export async function deletePurchaseOrderById(id){
    let query = "DELETE FROM purchase_orders WHERE purchase_order_id = ?";
    return db.query(query, [id]).then(([results, fields])=>results);
}

//edit purchase order in database
export async function updatePurOrdById (data, id){
    //console.log("_________________________________________________")
    //console.log(data);
    let info = [
        data.purchase_order_name, 
        data.status, 
        data.notes, 
        data.date_ordered, 
        data.date_received, 
        data.vendor_id, 
        id
    ];
    return db.query("UPDATE purchase_orders SET purchase_order_name = ?, status = ?, notes = ?, date_ordered = ?, date_received = ?, vendor_id = ? WHERE purchase_order_id = ?", info).then(([results, fields])=>results);
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//PURCHASE ORDER RECIPES
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//get all purchase order recipes
export async function getPurchaseOrderRecipes(){
    return db.query(getPurOrdRecs).then(([results, fields])=>results);
}

//insert purchase order recipe into database
export async function insertPurchaseOrderRecipe(data){
    let info = [
        data.purchase_order_id, 
        data.recipe_id, 
        data.qty,  
    ];
    let query = "INSERT INTO po_recipes (purchase_order_id, recipe_id, qty) VALUES (?, ?, ?);";
    db.query(query, info).then(([results, fields])=>results);
    return db.query("SELECT LAST_INSERT_ID()").then(([results, fields])=>results);
}

//delete purchase order recipe from database
export async function deletePurchaseOrderRecipeById(id){
    let query = "DELETE FROM po_recipes WHERE po_recipe_id = ?";
    return db.query(query, [id]).then(([results, fields])=>results);
}

//edit purchase order recipe in database
export async function updatePurOrdRecById (data, id){
    //console.log("_________________________________________________")
    //console.log(data);
    let info = [
        data.purchase_order_id, 
        data.recipe_id, 
        data.qty,  
        id
    ];
    return db.query("UPDATE po_recipes SET purchase_order_id = ?, recipe_id = ?, qty = ? WHERE po_recipe_id = ?", info).then(([results, fields])=>results);
}

//Batch insert recipe elements to the database
export async function batchInsertPurchaseOrderRecipeElements(values){
    let fields = "purchase_order_id, recipe_id, qty"
    let sql = "INSERT INTO po_recipes ("+fields+") VALUES ?"
    return db.query(sql, [values]).then(([results, fields])=>results);
}