//import connection
import db from "../config/database.js";

const getLoc = 'SELECT * FROM locations';
const getId = 'SELECT * FROM locations WHERE location_id = LAST_INSERT_ID()';

//get all locations
export async function getLocations(){
    return db.query(getLoc).then(([results, fields])=>results);
};

//create a location
export async function insertLocation(loc){
    let info = [
        loc.name,
    ];
    let queryinfo = [
        "name"
    ];
    let query = 'INSERT INTO locations ('+queryinfo+') VALUES (?)';
    
    db.query(query, info).then(([results, fields])=>results);

    return db.query(getId).then(([results, fields])=>results);
};

//edit a location 
export async function updateLocationById(loc, id){
    let info = [
        loc.name,
        id
    ];
    let queryinfo = [
        "name = ?"
    ];
    let query = 'UPDATE locations SET '+ queryinfo + ' WHERE location_id = ?';
    
    db.query(query, info).then(([results, fields])=>results);

    return db.query(getId).then(([results, fields])=>results);
};