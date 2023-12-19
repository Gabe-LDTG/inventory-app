//import connection
import db from "../config/database.js";

//get all cases
//cases.id, products.name, cases.units_per_case, cases.qty
export const getCases=(result)=>{
    db.query("SELECT * FROM cases INNER JOIN products ON cases.product_id = products.id",(err,results)=>{
        if(err){
            console.log(err);
            result(err,null);
        }else{
            console.log(results);
            result(null, results);
        }
    });
}

//get all processed cases (All processed cases should have a fnsku or asin and should not have a upc)
export const getProcCases=(result)=>{
    //DATE_FORMAT(cases.date_recieved, "%m %d %Y")
    db.query("SELECT cases.id, cases.units_per_case, cases.date_recieved, cases.notes, cases.product_id, products.name FROM cases INNER JOIN products ON cases.product_id = products.id WHERE (products.fnsku IS NOT NULL OR products.asin IS NOT NULL) AND (products.upc IS NULL OR products.upc = 0)",(err,results)=>{
        if(err){
            console.log(err);
            result(err,null);
        }else{
            //console.log('TESTING ______________________________')
            //console.log(results);
            result(null, results);
        }
    });
}

//get all unprocessed cases (all unprocessed cases should have UPC (or maybe item num))
export const getUnprocCases=(result)=>{
    db.query("SELECT cases.id, cases.units_per_case, cases.date_recieved, cases.notes, cases.product_id, products.name FROM cases INNER JOIN products ON cases.product_id = products.id WHERE products.upc IS NOT NULL AND (products.fnsku IS NULL AND products.asin IS NULL) OR (products.fnsku = '' AND products.asin = '')",(err,results)=>{
        if(err){
            console.log(err);
            result(err,null);
        }else{
            result(null, results);
        }
    });
}

//insert case to database
export const insertCase=(data,result)=>{
    //console.log(data);
    //console.log(data.product_id);
    db.query("INSERT INTO cases (product_id, units_per_case, notes, date_recieved) VALUES (?, ?, ?, ?)",[data.product_id, data.units_per_case, data.notes, data.date_recieved],(err,results)=>{
        if (err) {
            console.log(err);
            result(err, null);
        } else {
            console.log(results);
            result(null, results);
        }
    });
}

// Update Case to Database
export const updateCaseById = (data, id, result) => {
    //console.log("_________________________________________________")
    //console.log(data);
    db.query("UPDATE cases SET product_id = ?, units_per_case = ?, notes = ?, date_recieved = ? WHERE id = ?",[data.product_id, data.units_per_case, data.notes, data.date_recieved, id],(err,results)=>{
        if (err) {
            console.log(err);
            result(err, null);
        } else {
            result(null, results);
        }
    });
}

//Delete Case from Database
export const deleteCaseById = (id, result) => {
    console.log(id);
    db.query("DELETE FROM cases WHERE id = ?", [id], (err,results) => {
        if(err) {
            console.log(err);
            result(err, null);
        } else {
            result(null, results);
        }
    });
}