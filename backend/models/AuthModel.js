//import connection
import db from "../config/database.js";

//get all users
export const getUsers=()=>{
    return db.query("SELECT * FROM users").then(([results, fields])=>results);
}

//get user with specific username
export const getUserFromUsername=(username)=>{
    return db.query("SELECT * FROM users WHERE username = ? LIMIT 1",[username]).then(([results, fields])=>results[0]);
}

//insert user to database
export const insertUser=(data)=>{
    //console.log(data);
    //console.log(data.product_id);
    return db.query("INSERT INTO users (username, password, salt) VALUES (?, ?, ?)",[data.username, data.password, data.salt]).then(([results, fields])=>results);;
}