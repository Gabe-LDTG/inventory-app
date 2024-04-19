import {
    getRecipes,
    insertRecipe,
    updateRecipeById,
    deleteRecipeById
} from '../models/RecipeModel.js';

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
