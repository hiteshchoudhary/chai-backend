import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const options = {
    // Set the write concern to 'majority'
    writeConcern: {
      w: 'majority',
      j: true,
      wtimeout: 1000,
    },
  };


const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}?dbName=${DB_NAME}`,options)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB