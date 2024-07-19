//import functions from Cases model class
import{
    getCases,
    getCasesById,
    getCasesByType,
    getDeliveredCasesByType,
    insertCase,
    bulkInsertCases,
    updateCaseById,
    bulkUpdateCases,
    deleteCaseById,
    batchDeleteCase,
} from "../models/CaseModel.js";

//get all cases
export async function showCases(req,res){
    try {
        const cases = await getCases();
        res.json(cases);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

export async function showCasesIds(req,res){
    try {
        const cases = await getCasesById();
        res.json(cases);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
}

//get processed cases
export async function showProcCases(req,res){
    try {
        const procCases = await getCasesByType(true);
        res.json(procCases);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//get processed cases
export async function showUnprocCases(req,res){
    try {
        const unprocCases = await getCasesByType(false);
        res.json(unprocCases);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//get delivered unprocessed cases
export async function showDeliveredUnprocCases(req,res){
    try {
        const unprocCases = await getDeliveredCasesByType(false);
        res.json(unprocCases);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//get delivered processed cases
export async function showDeliveredProcCases(req,res){
    try {
        const unprocCases = await getDeliveredCasesByType(true);
        res.json(unprocCases);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//create new case
export async function createCase(req,res){
    try {
        const data=req.body;
        const createdCase = await insertCase(data);

        res.json(createdCase);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//create new cases in bulk
export async function bulkCreateCase(req,res){
    try {
        const data=req.body;
        const createdCases = await bulkInsertCases(data);

        res.json(createdCases);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

// Update Case 
export async function updateCase(req, res){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedCase = await updateCaseById(data, id);

        res.json(updatedCase);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

//update cases in bulk
export async function bulkUpdateCase(req,res){
    try {
        const data=req.body;
        console.log(data);
        const updatedCases = await bulkUpdateCases(data);

        res.json(updatedCases);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
};

//delete case
export async function deleteCase(req, res){
    try {
        const id = req.params.id;
        const deletedCase = await deleteCaseById(id);

        res.json(deletedCase);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
}

//Delete Cases
export async function batchDeleteCases(req, res){
    try {
        console.log("BATCH DELETE")
        console.log("REQ PARAMS",req.body)
        const id = req.body;

        const deletedCases = await batchDeleteCase(id);
        res.json(deletedCases);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
}