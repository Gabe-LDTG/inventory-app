//import functions from Auth model class
import { 
    getTests 
} from "../models/AuthModel";

//get all cases
export async function showTests(req,res){
    try{
        const users = await getTests();
        console.log(users);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};
