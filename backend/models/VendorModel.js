//import connection
import db from "../config/database.js";

const getVen = 'SELECT * FROM vendors';
const getId = 'SELECT * FROM vendors WHERE vendor_id = LAST_INSERT_ID()';

//get all vendors
export async function getVendors(){
    return db.query(getVen).then(([results, fields])=>results);
};

//create a vendor
export async function insertVendor(ven){
    let info = [
        ven.vendor_name,
        ven.vendor_nickname,
        ven.contact_email,
        ven.contact_name
    ];
    let queryinfo = [
        "vendor_name",
        "vendor_nickname",
        "contact_email",
        "contact_name"
    ];
    let query = 'INSERT INTO vendors ('+queryinfo+') VALUES (?, ?, ?, ?)';
    
    db.query(query, info).then(([results, fields])=>results);

    return db.query(getId).then(([results, fields])=>results);
};

//edit a vendor 
export async function updateVendorById(ven, id){
    let info = [
        ven.vendor_name,
        ven.vendor_nickname,
        ven.contact_email,
        ven.contact_name,
        id
    ];
    let queryinfo = [
        "vendor_name = ?",
        "vendor_nickname = ?",
        "contact_email = ?",
        "contact_name = ?"
    ];
    let query = 'UPDATE vendors SET '+ queryinfo + ' WHERE vendor_id = ?';
    
    db.query(query, info).then(([results, fields])=>results);

    return db.query(getId).then(([results, fields])=>results);
};