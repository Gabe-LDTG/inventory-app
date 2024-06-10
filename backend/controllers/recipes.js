import {
    getRecipes,
    insertRecipe,
    updateRecipeById,
    deleteRecipeById,
    getRecipeElements,
    insertRecipeElement,
    updateRecipeElementById,
    deleteRecipeElementById,
    batchInsertRecipeElements
} from '../models/RecipeModel.js';

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//RECIPES
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//get all recipes
export async function showRecipes(req, res){
    try {
        const recipes = await getRecipes();
        res.json(recipes);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

//create new recipe
export async function createRecipe(req, res){
    try {
        let data = req.body;
        const createdRecipe = await insertRecipe(data);
        console.log(createdRecipe);
        res.json(createdRecipe);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

//edit a recipe
export async function updateRecipe(req, res){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedRecipe = await updateRecipeById(data, id);
        res.json(updatedRecipe);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//delete a recipe
export async function deleteRecipe(req, res){
    try {
        const id = req.params.id;
        const deletedRecipe = await deleteRecipeById(id);
        res.json(deletedRecipe);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//RECIPE ELEMENTS
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

//get all recipe elements
export async function showRecipeElements(req, res){
    try {
        const recipes = await getRecipeElements();
        res.json(recipes);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

//create new recipe element
export async function createRecipeElement(req, res){
    try {
        let data = req.body;
        const createdRecipe = await insertRecipeElement(data);
        console.log(createdRecipe);
        res.json(createdRecipe);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

//edit a recipe element
export async function updateRecipeElement(req, res){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedRecipe = await updateRecipeElementById(data, id);
        res.json(updatedRecipe);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//delete a recipe element
export async function deleteRecipeElement(req, res){
    try {
        const id = req.params.id;
        const deletedRecipe = await deleteRecipeElementById(id);
        res.json(deletedRecipe);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

//Batch insert recipe elements
export async function batchInsertRecEl(req, res){
    try {
        console.log("REQ BODY", req.body);

        const data=req.body;

        console.log(data);

        const insertedRecipeElements = await batchInsertRecipeElements(data);
        
        res.json(insertedRecipeElements);

    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
}