import {
    getPurchaseOrders,
    insertPurchaseOrder,
    deletePurchaseOrderById,
    updatePurOrdById,
    getPurchaseOrderRecipes,
    insertPurchaseOrderRecipe,
    deletePurchaseOrderRecipeById,
    updatePurOrdRecById,
    batchInsertPurchaseOrderRecipeElements,
} from '../models/PurchaseOrderModel.js';

//get all purchase orders
export async function showPurchaseOrders(req,res){
    try {
        const purchaseOrders = await getPurchaseOrders();
        res.json(purchaseOrders);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//create new purchase order
export async function createPurchaseOrder (req,res){
    try {
        const data=req.body;
        let insertedPurchaseOrder = await insertPurchaseOrder(data);

        console.log("INSERTED PURCHASE ORDER ", insertedPurchaseOrder)
        
        res.json(insertedPurchaseOrder);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//Delete PurchaseOrder
export async function deletePurchaseOrder(req, res){
    try {
        const id = req.params.id;

        const deletedPurchaseOrder = await deletePurchaseOrderById(id);
        res.json(deletedPurchaseOrder);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
}

// Update Purchase Order 
export async function updatePurchaseOrder (req,res){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedPurchaseOrder = await updatePurOrdById(data, id);
        res.json(updatedPurchaseOrder);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

//get all purchase order recipes
export async function showPurchaseOrderRecipes(req,res){
    try {
        const purchaseOrders = await getPurchaseOrderRecipes();
        res.json(purchaseOrders);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//create new purchase order recipe
export async function createPurchaseOrderRecipe (req,res){
    try {
        const data=req.body;
        let insertedPurchaseOrderRecipe = await insertPurchaseOrderRecipe(data);

        console.log("INSERTED PURCHASE ORDER ", insertedPurchaseOrderRecipe)
        
        res.json(insertedPurchaseOrderRecipe);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//Delete PurchaseOrder Recipe
export async function deletePurchaseOrderRecipe(req, res){
    try {
        const id = req.params.id;

        const deletedPurchaseOrderRecipe = await deletePurchaseOrderRecipeById(id);
        res.json(deletedPurchaseOrderRecipe);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
}

// Update Purchase Order Recipe
export async function updatePurchaseOrderRecipe (req,res){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedPurchaseOrderRecipe = await updatePurOrdRecById(data, id);
        res.json(updatedPurchaseOrderRecipe);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

//Batch insert purchase order recipe elements
export async function batchInsertPoRecEl(req, res){
    try {
        console.log("REQ BODY", req.body);

        const data=req.body;

        console.log(data);

        const insertedPoRecipeElements = await batchInsertPurchaseOrderRecipeElements(data);
        
        res.json(insertedPoRecipeElements);

    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
}