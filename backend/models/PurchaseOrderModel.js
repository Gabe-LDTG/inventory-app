//import connection
import db from "../config/database.js";

const getPurOrd = 'SELECT * FROM purchase_orders';

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
        data.vendor, 
    ];
    let query = "INSERT INTO purchase_orders (purchase_order_name, status, notes, date_ordered, date_received, vendor) VALUES (?, ?, ?, ?, ?, ?);";
    db.query(query, info).then(([results, fields])=>results);
    return db.query("SELECT LAST_INSERT_ID();").then(([results, fields])=>results);
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
        data.vendor, 
        id
    ];
    return db.query("UPDATE purchase_orders SET purchase_order_name = ?, status = ?, notes = ?, date_ordered = ?, date_received = ?, vendor = ? WHERE purchase_order_id = ?", info).then(([results, fields])=>results);
}