//import connection
import db from "../config/database.js";

const getAllPicklists = "SELECT * FROM picklists";
const getAllPicklistElements = "SELECT * FROM picklist_elements"

//get all picklists
export async function getPicklists(){
    return db.query(getAllPicklists).then(([results, fields])=>results);
};

//insert picklist into database
export async function insertPicklist(data){
    let info = [
        data.label,
    ];
    let query = "INSERT INTO picklists (label) VALUES (?);";
    db.query(query, info).then(([results, fields])=>results);
    return db.query("SELECT LAST_INSERT_ID()").then(([results, fields])=>results);
};

//delete a picklist from database
export async function deletePicklistById(id){
    let query = "DELETE FROM picklists WHERE picklist_id = ?";
    return db.query(query, [id]).then(([results, fields])=>results);
};

//edit picklist in database
export async function updatePicklistById (data, id){
    //console.log("_________________________________________________")
    //console.log(data);
    let info = [
        data.label,
        id
    ];
    return db.query("UPDATE picklists SET label = ? WHERE picklist_id = ?", info).then(([results, fields])=>results);
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//PICKLIST ELEMENTS
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//get all picklist elements
export async function getPicklistElements(){
    return db.query(getAllPicklistElements).then(([results, fields])=>results);
};

//insert picklist element into database
export async function insertPicklistElement(data){
    let info = [
        data.picklist_id,
        data.recipe_id,
        data.case_qty,
        data.notes,
    ];
    let query = "INSERT INTO picklist_elements (picklist_id, recipe_id, case_qty, notes) VALUES (?, ?, ?, ?);";
    db.query(query, info).then(([results, fields])=>results);
    return db.query("SELECT LAST_INSERT_ID()").then(([results, fields])=>results);
};

//delete a picklist element from database
export async function deletePicklistElementById(id){
    let query = "DELETE FROM picklist_elements WHERE picklist_element_id = ?";
    return db.query(query, [id]).then(([results, fields])=>results);
};

//edit picklist element in database
export async function updatePicklistElementById (data, id){
    //console.log("_________________________________________________")
    //console.log(data);
    let info = [
        data.picklist_id,
        data.recipe_id,
        data.case_qty,
        data.notes,
        id
    ];
    return db.query("UPDATE picklist_elements SET picklist_id = ?, recipe_id = ?, case_qty = ?, notes = ? WHERE picklist_element_id = ?", info).then(([results, fields])=>results);
};

//Batch insert picklist elements to the database
export async function batchInsertPicklistEl(values){
    let fields = "picklist_id, recipe_id, case_qty, notes";
    let sql = "INSERT INTO picklist_elements ("+fields+") VALUES ?";
    return db.query(sql, [values]).then(([results, fields])=>results);
};

// Batch Update picklist elements in Database
export async function batchUpdatePicklistEl(data){
    console.log(data);
    const fields = "picklist_element_id, picklist_id, recipe_id, case_qty, notes";
    const updateFields = "picklist_id = VALUES(picklist_id), recipe_id = VALUES(recipe_id), case_qty = VALUES(case_qty), notes = VALUES(notes)"
    return db.query("INSERT INTO picklist_elements ("+fields+") VALUES ? ON DUPLICATE KEY UPDATE "+updateFields,[data]).then(([results, fields])=>results);
};
