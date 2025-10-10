<<<<<<< HEAD
// require('dotenv').config({path: './env'})
import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'
dotenv.config({
    path: './.env'
})



connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})










/*
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/
=======
// mongoose is used to connect the database 
// Wrap the database responses in try catch , so to handle it perfectly 

/*
// My code 
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express"
import dotenv from "dotenv";
dotenv.config(); // load .env file
const app = express();

// (Immediately Invoked Function Expression) is used here 
// we can also use normal function and then normally call them 
// it wiil be the same as Immediately Invoked Function Expression)
// DB connection code 

// This is the first way to connect to the DB , here we write all the connection logic in index.js itself

(async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log("Connected Succesfully")
// Here we are listening for the event of error
        app.on("error", (error) => {
            console.log("EROR:", error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`App is Listening on port ${process.env.PORT}`);

        });

    } catch (error) {
        console.log(error);
        throw error;

    }


})();



*/
// Chatgpt code 
// In this method , we are connecting the database in this index.js file itself 
// In the 2nd Method , we will be connecting through different file 
// will be keeping connection code different 

// This is chatgpt connected code for the first method 
// 1st way to do mongoDb connection 
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";
// import express from "express";
// import dotenv from "dotenv";

// dotenv.config(); // load .env file

// const app = express();

// (async() => {
//     try {
//         // Mongo connection
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         console.log("✅ MongoDB connected successfully");

//         // Error handling for express app
//         app.on("error", (error) => {
//             console.error("Express error:", error);
//             throw error;
//         });

//         // Start server
//         app.listen(process.env.PORT, () => {
//             console.log(`🚀 App is listening on port ${process.env.PORT}`);
//         });
//     } catch (error) {
//         console.error("❌ MongoDB connection failed:", error);
//         throw error;
//     }
// })();










// This is the second method importing connectDB() from db folder index.js 
// This second  method  without changing the script in package.json 
// Script for this approach 
/*"scripts": {

        "dev": "nodemon src/index.js"

    },
*/
// Now the script in package.json is changed 
// here 
import dotenv from "dotenv";
dotenv.config();
// import express from "express"; // done in start of the project
// const app = express(); // done in start of the project
import { app } from './app.js'; // This line is important to load all the routes 
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
// This connectDB will return a promise 
// So for that , .then and .catch is used 
connectDB()
    .then(() => {
        // Start the server 
        app.listen(process.env.PORT || 8000, () => {
            console.log(`The Server is running on the port ${process.env.PORT}`);

        })
        // Listening for the event of error 
        app.on("error", (error) => {
            console.log("EROR:", error);
            throw error;
        });
    })
    .catch((error) => {
        console.log("MONGO_DB Connection Failed ", error);

    })


// Index.js is mostly kept cleaned
>>>>>>> myrepo/main
