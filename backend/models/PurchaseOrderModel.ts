//import connection
import db from "../config/database.js";

const getPurOrd = 'SELECT * FROM purchase_orders';

//get all purchase orders
export async function getPurchaseOrders(){
    return db.query(getPurOrd).then(([results, fields])=>results);
}

//insert purchase order into database
export async function insertPurchaseOrder(data: any){
    let info = [
        data.name, 
        data.status,
    ];
    let query = "INSERT INTO purchase_orders (purchase_order_name, status) VALUES (?, ?)";
    return db.query(query, info).then(([results, fields])=>results);
}

//delete purchase order from database
export async function deletePurchaseOrder(id: any){
    let query = "DELETE FROM purchase_orders WHERE purchase_order_id = ?";
    return db.query(query, [id]).then(([results, fields])=>results);
}

//edit purchase order in database
export async function updatePurOrdById (data: any, id: any){
    //console.log("_________________________________________________")
    //console.log(data);
    let info = [data.purchase_order_name, data.status, id];
    return db.query("UPDATE products SET purchase_order_name = ?, status = ? WHERE purchase_order_id = ?", info).then(([results, fields])=>results);
}