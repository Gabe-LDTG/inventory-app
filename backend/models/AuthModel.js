//import connection
import db from "../config/database.js";

//get all users
export async function getUsers(){
    return db.query("SELECT * FROM users").then(([results, fields])=>results);
}

//get user with specific username
export async function getUserFromUsername(username){
    return db.query("SELECT * FROM users WHERE username = ? LIMIT 1",[username]).then(([results, fields])=>results[0]);
}

//get the password and salt for a user to validate
export async function getPasswordFromUsername(username){
    return db.query("SELECT password, salt FROM users WHERE username = ? LIMIT 1",[username]).then(([results, fields])=>results[0]);
}

//get the user based on the session user id
export async function getSessionUser(userId){
    return db.query("SELECT * FROM users WHERE user_id = ? LIMIT 1",[userId]).then(([results, fields])=>results[0]);
}

//insert user to database
export async function insertUser(data){
    //console.log(data);
    //console.log(data.product_id);
    return db.query("INSERT INTO users (username, password, salt) VALUES (?, ?, ?)",[data.username, data.password, data.salt]).then(([results, fields])=>results);;
}