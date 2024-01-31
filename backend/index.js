//import connection
import db from "./config/database.js";

//import express
import express from "express";
import session from "express-session";
import mysqlSession from "express-mysql-session";

const SessionStore = mysqlSession(session);
const sessionStore = new SessionStore({}, db)

//import cors
import cors from "cors";

//import routes
import Router from "./routes/routes.js";

//init express
const app = express();
const port = 5000;

//use express json
app.use(express.json());

//use cors
app.use(cors());

app.use(session({
    secret: 'Tiny Cactus',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cook: {
        sameSite: false,
        maxAge: 1000,
    }
}));

//use router
app.use(Router);

//PORT
app.listen(port,()=>{
    console.log("Server running successfully on port " + port);
})