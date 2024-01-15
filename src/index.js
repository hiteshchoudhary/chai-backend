// require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import connetToDb from "./db/db.js";
import { app } from './app.js';

//config dotenv file
dotenv.config({
    path: './.env' //.env pass is good
})

const PORT = process.env.PORT || 8000

//connect to the database 
connetToDb() // async function return promise
.then(()=>{
    app.on("error", (error)=>{
        console.log("Error", error)
        throw error;
    })
    app.listen(PORT, ()=>{
        console.log(`server is running at http://localhost:${PORT}`)
    })
})
.catch((err)=> {
    console.log("Mongo Db connection failed!!!", err)
})
