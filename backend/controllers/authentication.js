//import functions from Auth model class
import{
    getUsers,
    getUserFromUsername,
    insertUser,
    getSessionUser,
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
        //console.log("USER: ", user);

        if(user){
            //console.log(user.salt);

            const hashedPass = await hash(user.salt, data.password);
            data.password = hashedPass;
    
            //console.log("TRY :", data.password);
            //console.log("CHECK :", user.password);
                    
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
                console.log("SESSION USER ID: ", req.session.user.user_id);
                console.log("COOKIE: ", req.session.cookie);
                //let sessionUser = await getSessonUser();
                //sessionUser['id'] = req.session.user.user_idid;
                //sessionUser['username'] = req.session.user.username;
                //res.send(sessionUser);
                //console.log("SESSION: ",req.session.user.id);
                if(req.session){
                    //await checkSessionUser();
                    res.sendStatus(200);
                    console.log("SESSION EXISTS");
                }
            }
    
            else if (data.password != user.password){
                console.log("INVALID PASSWORD");
                throw new Error('Incorrect password');
            }    
    
            else{
                console.log("FAILURE");
                res.sendStatus(401);
            }
        }

        else if(!user){
            console.log("INVALID USERNAME");
            throw new Error('Username not found');
        }
        
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
        //err.request.data
    }
};

export async function checkSessionUser(req, res) {
    try {
        console.log("SESSION USER ID: ", req.session.user);
      if(!req.session)
        throw new Error('Tried to get user but no session.')
  
      const user = await getSessionUser(req.session.user.user_id);
      if(!user)
        throw new Error('Tried to get user from session but they don\'t exist!');

      console.log("SESSION USER IN FUNCTION",user);
      res.json(user);
  
    } catch(err) {
      console.error('Error getting user:', err);
      res.status(403).send('Not logged in');
    }
  }

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

export async function endSession(req, res, next){
    // logout logic

  // clear the user from the session object and save.
  // this will ensure that re-using the old session id
  // does not have a logged in user
  req.session.user = null
  req.session.save(function (err) {
    if (err) next(err)

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) next(err)
      return res;
    })
  })
};

