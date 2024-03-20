import {
    getRecipes,
    insertRecipe
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
