//import functions from Auth model class
import{
    getUsers,
    getUserFromUsername,
    insertUser,
} from "../models/AuthModel.js";

import { pbkdf2, randomBytes } from 'crypto';

const mySalt = getSalt();
const myHash = await hash(mySalt, 'Test');

// console.log("Salt", mySalt);
// console.log("Hash", myHash);

//get all cases
export async function showUsers(req,res){
    try{
        const users = await getUsers();
        console.log(users);
        res.json(users);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};

//create new case
export async function createUser(req,res) {
    try {
        const data=req.body;
        data.salt = getSalt();

        const hashedPass = await hash(data.salt, data.password);
        data.password = hashedPass;

        const user = await insertUser(data);

        res.json(user);

    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }

};

export async function validate(req, res){
    try {
        const data=req.body;
        const user = await getUserFromUsername(data.username);

        console.log(user.salt);

        const hashedPass = await hash(user.salt, data.password);
        data.password = hashedPass;

        console.log("TRY :", data.password);
        console.log("CHECK :", user.password);
                
        if(data.password == user.password){
            console.log("SUCCESS");
            await new Promise((ret, rej) => {
                req.session.regenerate(err => {
                    if(err) rej(err)
                    else {
                        req.session.user = user
                        req.session.save(err => {
                            if(err) rej(err)
                            else ret();
                        })
                    }
                })
            });
            //res.sendStatus(204);
            res.send(req.session.sessionID);
        }
        else{
            console.log("FAILURE");
            res.sendStatus(401);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
        //err.request.data
    }
};

export function getSalt(){
    return randomBytes(128).toString('hex');
};

export async function hash(salt, password) {
    return new Promise((res, rej) => {
      pbkdf2(password, salt, 10000, 512, 'sha256', (err, data) => {
        if(err)
          return rej(err);
        else
          return res(data.toString('hex'));
      });
    });
  };

