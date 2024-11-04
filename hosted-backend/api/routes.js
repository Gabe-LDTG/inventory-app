//import express
import express from "express";

import { 
    showTests
} from "../controllers/authentication";

//init express router
const router=express.Router();

//USERS------------------------------------------------------------------------------
//get all users
router.get("/tests",showTests);