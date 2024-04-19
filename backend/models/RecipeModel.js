//import connection
import db from "../config/database.js";

const getRec = 'SELECT * FROM recipes';
const getId = 'SELECT LAST_INSERT_ID()';

//get all recipes
export async function getRecipes(){
    return db.query(getRec).then(([results, fields])=>results);
};

//create a recipe
export async function insertRecipe(rec){
    let info = [
        rec.product_needed,
        rec.units_needed,
        rec.product_made,
    ];
    let queryinfo = [
        "product_needed",
        "units_needed",
        "product_made",
    ];
    let query = 'INSERT INTO recipes ('+queryinfo+') VALUES (?, ?, ?)';
    
    db.query(query, info).then(([results, fields])=>results);

    return db.query(getId).then(([results, fields])=>results);
};

//edit a recipe
export async function updateRecipeById(data, id){
    let info = [
        data.product_needed,
        data.units_needed,
        id
    ];
    return db.query('UPDATE recipes SET product_needed = ?, units_needed = ? WHERE recipe_id = ?', info).then(([results, fields])=>results);
};

//delete a recipe
export async function deleteRecipeById(id){
    return db.query("DELETE FROM recipes WHERE recipe_id = ?", id).then(([results, fields])=>results);
};