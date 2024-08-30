import {
    getRequestsToProcess,
    insertRequestToProcess,
    deleteRequestById,
    updateRequestById,
} from '../models/RequestModel.js';

//get all requests to process
export async function showRequests(req,res){
    try {
        const requests = await getRequestsToProcess();
        res.json(requests);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//create new request to process
export async function createRequestToProcess (req,res){
    try {
        const data=req.body;
        let insertedRequest = await insertRequestToProcess(data);

        console.log("INSERTED REQUEST TO PROCESS ", insertedRequest)
        
        res.json(insertedRequest);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//Delete a request
export async function deleteRequest(req, res){
    try {
        const id = req.params.id;

        const deletedRequest = await deleteRequestById(id);
        res.json(deletedRequest);
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
};

// Update a request
export async function updateRequest (req,res){
    try {
        const data = req.body;
        const id = req.params.id;

        const updatedRequest = await updateRequestById(data, id);
        res.json(updatedRequest);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};