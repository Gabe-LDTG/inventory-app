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
app.use(express.json({limit: '50mb'}));

//use cors
app.use(cors(
    {
        credentials: true,
        origin: ['http://localhost:5173',
        'https://main--mellifluous-mooncake-f17d48.netlify.app/',
    ],
    }
));

app.use(session({
    secret: 'Tiny Cactus',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: false,
        httpOnly: false,
        //maxAge: 1000,
    },
    name: 'Cat Cookie',
}));

sessionStore.onReady().then(() => console.log('READY'));
//sessionStore.addListener('');

//use router
app.use(Router);

//PORT
app.listen(port,()=>{
    console.log("Server running successfully on port " + port);
})