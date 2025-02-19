//import express
import express from "express";
import session from "express-session";

//import cors
import cors from "cors";

import Router from './api/routes.js';

//init express
const app = express();
const port = 5000;

//use express json
app.use(express.json({limit: '50mb'}));

app.use('/api', Router);

//use cors
app.use(cors(
    {
        credentials: true,
        origin: ['http://localhost:5173',
        'https://einventory.netlify.app/',
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