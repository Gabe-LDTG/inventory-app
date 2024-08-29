//import connection
import db from "../config/database.js";

const getRequests = "SELECT * FROM requests_to_process";

//get all requests to process
export async function getRequestsToProcess(){
    return db.query(getRequests).then(([results, fields])=>results);
};

//insert request into database
export async function insertRequestToProcess(data){
    let info = [
        data.case_id,
        data.notes,
        data.status,
        data.labels_printed,
        data.ship_label,
        data.priority,
        data.ship_to_amz,
        data.deadline,
        data.warehouse_qty,
    ];
    let query = "INSERT INTO requests_to_process (case_id, notes, status, labels_printed, ship_label, priority, ship_to_amz, deadline, warehouse_qty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    db.query(query, info).then(([results, fields])=>results);
    return db.query("SELECT LAST_INSERT_ID()").then(([results, fields])=>results);
};

//delete a request from database
export async function deleteRequestById(id){
    let query = "DELETE FROM requests_to_process WHERE request_id = ?";
    return db.query(query, [id]).then(([results, fields])=>results);
};

//edit a request in database
export async function updateRequestById (data, id){
    //console.log("_________________________________________________")
    //console.log(data);
    let info = [
        data.case_id,
        data.notes,
        data.status,
        data.labels_printed,
        data.ship_label,
        data.priority,
        data.ship_to_amz,
        data.deadline,
        data.warehouse_qty,
        id
    ];
    return db.query("UPDATE requests_to_process SET case_id = ?, notes = ?, status = ?, labels_printed = ?, ship_label = ?, priority = ?, ship_to_amz = ?, deadline = ?, warehouse_qty = ? WHERE request_id = ?", info).then(([results, fields])=>results);
}