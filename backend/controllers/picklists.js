import {
    getPicklists,
    insertPicklist,
    deletePicklistById,
    updatePicklistById,
    getPicklistElements,
    insertPicklistElement,
    deletePicklistElementById,
    updatePicklistElementById,
    batchInsertPicklistEl,
    batchUpdatePicklistEl
} from '../models/PicklistModel.js';

//get all picklists
export async function showPicklists(req,res){
    try {
        const picklists = await getPicklists();
        res.json(picklists);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//create new picklist
export async function createPicklist (req,res){
    try {
        const data=req.body;
        const insertedPicklist = await insertPicklist(data);

        console.log("INSERTED PICKLIST ", insertedPicklist)
        
        res.json(insertedPicklist);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//Delete Picklist
export async function deletePicklist(req, res){
    try {
        const id = req.params.id;

        const deletedPicklist = await deletePicklistById(id);
        res.json(deletedPicklist);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// Update a Picklist
export async function updatePicklist(req, res) {
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedPicklist = await updatePicklistById(data, id);
        res.json(updatedPicklist);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//PICKLIST ELEMENTS
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Get all Picklist elements
export async function showPicklistElements(req, res) {
    try {
        const picklistElements = await getPicklistElements();
        res.json(picklistElements);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

// Insert a Picklist Element into the database
export async function createPicklistElement(req, res) {
    try {
        const data = req.body;
        const insertedPicklistElement = await insertPicklistElement(data);

        console.log("INSERTED PICKLIST ELEMENT ", insertedPicklistElement);

        res.json(insertedPicklistElement);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

// Delete a Picklist Element from the database
export async function deletePicklistElement(req, res) {
    try {
        const id = req.params.id;
        const deletedPicklistElement = await deletePicklistElementById(id);

        res.json(deletedPicklistElement);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

// Update a Picklist Element from the database
export async function updatePicklistElement(req, res) {
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedPicklistElement = await updatePicklistElementById(data, id);
        res.json(updatedPicklistElement);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

// Batch insert Picklist Elements into the database
export async function batchInsertPicklistElements(req, res) {
    try {
        const data = req.body;
        const insertedPicklistElements = await batchInsertPicklistEl(data);

        res.json(insertedPicklistElements);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};

// Batch update Picklist Elements into the database
export async function batchUpdatePicklistElements(req, res) {
    try {
        const data = req.body;
        const updatedPicklistElements = await batchUpdatePicklistEl(data);

        res.json(updatedPicklistElements);
    } catch (error) {
        console.error(error);
        res.status(500).send(error.message);
    }
};