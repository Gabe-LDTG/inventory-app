//import functions from Cases model class
import{
    getCases,
    getProcCases,
    getUnprocCases,
    insertCase,
    deleteCaseById,
} from "../models/CaseModel.js";

//get all cases
export const showCases = (req,res) => {
    getCases((err,results) => {
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
};

//get processed cases
export const showProcCases = (req,res) => {
    getProcCases((err,results) => {
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
};

//get processed cases
export const showUnprocCases = (req,res) => {
    getUnprocCases((err,results) => {
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
};

//create new case
export const createCase = (req,res) => {
    const data=req.body;
    insertCase(data, (err,results)=> {
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
};

//delete case
export const deleteCase = (req, res) => {
    const id = req.params.id;
    deleteCaseById(id, (err, results) =>{
        if(err){
            res.send(err);
        }else{
            res.json(results);
        }
    });
}