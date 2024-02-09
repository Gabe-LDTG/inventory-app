import mysql from "mysql2/promise";
import { Sequelize } from 'sequelize';

//create the connection to database
const db= await mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"",
    database:"einventory"
});

// Option 3: Passing parameters separately (other dialects)
const sequelize = new Sequelize('einventory', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
  });

  sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
 }).catch((error) => {
    console.error('Unable to connect to the database: ', error);
 });

export default db;
