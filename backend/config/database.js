import mysql from "mysql2/promise";

//create the connection to database
const db= await mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"einventory"
});

export default db;