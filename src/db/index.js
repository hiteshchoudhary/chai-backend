<<<<<<< HEAD
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

=======
import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

import express from "express"
import dotenv from "dotenv";
dotenv.config();
const app = express();
>>>>>>> myrepo/main

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
<<<<<<< HEAD
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
=======
        // Through mongoose.connect , there is object returned of connection 
        //  console.log("Connected Succesfully", connectionInstance.connection)
        console.log("Connected Succesfully database")


    } catch (error) {
        console.log("MONGODB Connection error of db", error);
        process.exit(1)

>>>>>>> myrepo/main
    }
}

export default connectDB