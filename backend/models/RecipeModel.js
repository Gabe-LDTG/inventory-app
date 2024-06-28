//import connection
import db from "../config/database.js";

const getRec = 'SELECT * FROM recipes';
const getRecEl = 'SELECT * FROM recipe_elements';
const getId = 'SELECT LAST_INSERT_ID()';

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//RECIPES
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//get all recipes
export async function getRecipes(){
    return db.query(getRec).then(([results, fields])=>results);
};

//create a recipe
export async function insertRecipe(rec){
    let info = [
        rec.label,
        rec.vendor_id
    ];
    let queryinfo = [
        "label",
        "vendor_id"
    ];
    let query = 'INSERT INTO recipes ('+queryinfo+') VALUES (?, ?)';
    
    db.query(query, info).then(([results, fields])=>results);

    return db.query(getId).then(([results, fields])=>results);
};

//edit a recipe
export async function updateRecipeById(data, id){
    let info = [
        id,
        data.label,
        data.vendor_id
    ];
    return db.query('UPDATE recipes SET label = ?, vendor_id = ? WHERE recipe_id = ?', info).then(([results, fields])=>results);
};

//delete a recipe
export async function deleteRecipeById(id){
    return db.query("DELETE FROM recipes WHERE recipe_id = ?", id).then(([results, fields])=>results);
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//RECIPE ELEMENTS
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//get all recipe elements
export async function getRecipeElements(){
    return db.query(getRecEl).then(([results, fields])=>results);
};

//create a recipe element
export async function insertRecipeElement(recEl){
    let info = [
        recEl.recipe_id,
        recEl.product_id,
        recEl.type,
        recEl.qty,
    ];
    let queryinfo = [
        "recipe_id",
        "product_id",
        "type",
        "qty",
    ];
    let query = 'INSERT INTO recipe_element ('+queryinfo+') VALUES (?, ?, ?, ?)';
    
    db.query(query, info).then(([results, fields])=>results);

    return db.query(getId).then(([results, fields])=>results);
};

//edit a recipe element
export async function updateRecipeElementById(data, id){
    let info = [
        data.recipe_id,
        data.product_id,
        data.type,
        data.qty,
        id
    ];
    return db.query('UPDATE recipe_element SET recipe_id = ?, product_id = ?, type = ?, qty = ? WHERE recipe_element_id = ?', info).then(([results, fields])=>results);
};

//delete a recipe element
export async function deleteRecipeElementById(id){
    return db.query("DELETE FROM recipe_element WHERE recipe_element_id = ?", id).then(([results, fields])=>results);
};

//Batch insert recipe elements to the database
export async function batchInsertRecipeElements(values){
    let fields = "product_id, qty, type, recipe_id"
    let sql = "INSERT INTO recipe_elements ("+fields+") VALUES ?"
    return db.query(sql, [values]).then(([results, fields])=>results);
}