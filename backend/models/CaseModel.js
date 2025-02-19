//import connection
import db from "../config/database.js";

const whereProc = "WHERE ((products.fnsku IS NOT NULL OR products.asin IS NOT NULL) AND (products.fnsku <> '' OR products.asin <> ''))";
const whereUnproc = "WHERE ((products.fnsku IS NULL AND products.asin IS NULL) OR (products.fnsku = '' AND products.asin = '') OR (products.fnsku IS NULL AND products.asin = '') OR (products.fnsku = '' AND products.asin IS NULL))";
const whereDelivered = "((cases.status <> 'Draft') AND (cases.status <> 'Submitted') AND (cases.status <> 'Ordered') AND (cases.status <> 'Inbound') AND (cases.status <> 'BO') AND (cases.status <> 'Back Ordered'))";
//Draft, Submitted, Ordered, Inbound, BO, Back Ordered

//get all cases
//cases.case_id, products.name, cases.units_per_case, cases.qty
export async function getCases(){
    return db.query("SELECT * FROM cases INNER JOIN products ON cases.product_id = products.product_id").then(([results, fields])=>results);
}

export async function getCasesById(){
    return db.query("SELECT case_id FROM cases").then(([results, fields])=>results);
}

//get all processed cases (All processed cases should have a fnsku or asin and should not have a upc)
/* export async function getProcCases(){
    //DATE_FORMAT(cases.date_received, "%m %d %Y")
    return db.query("SELECT cases.case_id, cases.units_per_case, cases.date_received, cases.notes, cases.product_id, cases.location, products.name FROM cases INNER JOIN products ON cases.product_id = products.product_id ").then(([results, fields])=>results);
} */

//get all processed cases (All processed cases should have a fnsku or asin and should not have a upc)
export async function getCasesByType(processed){
    //DATE_FORMAT(cases.date_received, "%m %d %Y")
    return db.query("SELECT cases.case_id, cases.units_per_case, cases.date_received, "
     + "cases.notes, cases.product_id, cases.location, cases.status, cases.purchase_order_id, "
     + "products.name FROM cases INNER JOIN products ON cases.product_id = products.product_id "
     + (processed ? whereProc : whereUnproc)
    ).then(([results, fields])=>results);
}

//get all delivered cases (All delivered cases should not have a status of Draft, Submitted, Ordered, Inbound, BO, or Back Ordered)
export async function getDeliveredCasesByType(processed){
    //DATE_FORMAT(cases.date_received, "%m %d %Y")
    return db.query(`
        SELECT cases.case_id, cases.units_per_case, cases.date_received, cases.notes, cases.product_id, cases.location, cases.status, cases.purchase_order_id, products.name
            FROM cases INNER JOIN products ON cases.product_id = products.product_id
            ${processed ? whereProc : whereUnproc} AND ${whereDelivered}`
    ).then(([results, fields])=>results);
}

/* //get all unprocessed cases (all unprocessed cases should have UPC (or maybe item num))
export async function getUnprocCases(){
    return db.query("SELECT cases.case_id, cases.units_per_case, cases.date_received, cases.notes, cases.product_id, cases.location, products.name FROM cases INNER JOIN products ON cases.product_id = products.product_id ").then(([results, fields])=>results);
} */

//insert case to database
export async function insertCase(data){
    //console.log(data);
    //console.log(data.product_id);
    return db.query("INSERT INTO cases (product_id, units_per_case, location, notes, date_received, status, purchase_order_id) VALUES (?, ?, ?, ?, ?, ?, ?)",[data.product_id, data.units_per_case, data.location, data.notes, data.date_received, data.status, data.purchase_order_id]).then(([results, fields])=>results);
}

export async function bulkInsertCases(data){
    console.log(data)
    return db.query("INSERT INTO cases (product_id, units_per_case, location, notes, date_received, status, purchase_order_id) VALUES ?",[data]).then(([results, fields])=>results);
}

// Update Case to Database
export async function updateCaseById(data, id){
    //console.log("_________________________________________________")
    //console.log(data);
    return db.query("UPDATE cases SET product_id = ?, units_per_case = ?, location = ?, notes = ?, date_received = ?, status = ? WHERE case_id = ?",[data.product_id, data.units_per_case, data.location, data.notes, data.date_received, data.status, id]).then(([results, fields])=>results);
}

// Bulk Update Cases in Database
export async function bulkUpdateCases(data){
    console.log(data);
    const fields = "case_id, product_id, units_per_case, location, notes, date_received, status, purchase_order_id"
    const updateFields = "product_id = VALUES(product_id), units_per_case = VALUES(units_per_case), location = VALUES(location), notes = VALUES(notes), date_received = VALUES(date_received), status = VALUES(status)"
    return db.query("INSERT INTO cases ("+fields+") VALUES ? ON DUPLICATE KEY UPDATE "+updateFields,[data]).then(([results, fields])=>results);
}

/* // Bulk Update Cases in Database
export async function bulkUpdateCasesV2(data){
    console.log(data);

    let dbQuery = [];
    data.forEach(record => {
        if (record[4] !== null){
            record[4] = "'"+record[4]+"'";
        }
        let tempString = "UPDATE cases SET product_id = "+record[1]+", units_per_case = "+record[2]+", location = "+record[3]+", notes = "+record[4]+", date_received = "+record[5]+", status = '"+record[6]+"' WHERE case_id = "+record[0]+"; "
        dbQuery += tempString;
    })
    console.log("START TRANSACTION; "+dbQuery+" COMMIT;");

    return db.query(dbQuery).then(([results, fields])=>results);
} */

//Delete Case from Database
export async function deleteCaseById(id){
    console.log(id);
    return db.query("DELETE FROM cases WHERE case_id = ?", [id]).then(([results, fields])=>results);
}

//Batch delete case from the database
export async function batchDeleteCase(values){
    let sql = "DELETE FROM cases WHERE case_id IN (?)"
    return db.query(sql, [values]).then(([results, fields])=>results);
}