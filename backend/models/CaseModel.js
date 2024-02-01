//import connection
import db from "../config/database.js";

const whereProc = "WHERE (products.fnsku IS NOT NULL OR products.asin IS NOT NULL) AND (products.fnsku <> '' OR products.asin <> '')";
const whereUnproc = "WHERE (products.fnsku IS NULL AND products.asin IS NULL) OR (products.fnsku = '' AND products.asin = '') OR (products.fnsku IS NULL AND products.asin = '') OR (products.fnsku = '' AND products.asin IS NULL)";

//get all cases
//cases.id, products.name, cases.units_per_case, cases.qty
export async function getCases(){
    return db.query("SELECT * FROM cases INNER JOIN products ON cases.product_id = products.id").then(([results, fields])=>results);
}

//get all processed cases (All processed cases should have a fnsku or asin and should not have a upc)
/* export async function getProcCases(){
    //DATE_FORMAT(cases.date_recieved, "%m %d %Y")
    return db.query("SELECT cases.id, cases.units_per_case, cases.date_recieved, cases.notes, cases.product_id, cases.location, products.name FROM cases INNER JOIN products ON cases.product_id = products.id ").then(([results, fields])=>results);
} */

//get all processed cases (All processed cases should have a fnsku or asin and should not have a upc)
export async function getCasesByType(processed){
    //DATE_FORMAT(cases.date_recieved, "%m %d %Y")
    return db.query("SELECT cases.id, cases.units_per_case, cases.date_recieved, cases.notes, cases.product_id, cases.location, products.name FROM cases INNER JOIN products ON cases.product_id = products.id "+ (processed ? whereProc : whereUnproc)).then(([results, fields])=>results);
}

/* //get all unprocessed cases (all unprocessed cases should have UPC (or maybe item num))
export async function getUnprocCases(){
    return db.query("SELECT cases.id, cases.units_per_case, cases.date_recieved, cases.notes, cases.product_id, cases.location, products.name FROM cases INNER JOIN products ON cases.product_id = products.id ").then(([results, fields])=>results);
} */

//insert case to database
export async function insertCase(data){
    //console.log(data);
    //console.log(data.product_id);
    return db.query("INSERT INTO cases (product_id, units_per_case, location, notes, date_recieved) VALUES (?, ?, ?, ?, ?)",[data.product_id, data.units_per_case, data.location, data.notes, data.date_recieved]).then(([results, fields])=>results);
}

// Update Case to Database
export async function updateCaseById(data, id){
    //console.log("_________________________________________________")
    //console.log(data);
    return db.query("UPDATE cases SET product_id = ?, units_per_case = ?, location = ?, notes = ?, date_recieved = ? WHERE id = ?",[data.product_id, data.units_per_case, data.location, data.notes, data.date_recieved, id]).then(([results, fields])=>results);
}

//Delete Case from Database
export async function deleteCaseById(id){
    console.log(id);
    return db.query("DELETE FROM cases WHERE id = ?", [id]).then(([results, fields])=>results);
}