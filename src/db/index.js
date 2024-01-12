import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// const connectDB = async () => {
//     try {
//         const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
//     } catch (error) {
//         console.log("MONGODB connection FAILED ", error.message);
//         process.exit(1)
//     }
// }

const connectDB = async()=> {
  mongoose
    .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    ?.then(() => console.log("Connected to Database Successfully"))
    .catch((error) => {
      console.log("Error Occured At Connection", error);
      process.exit(1);
    });
}

export default connectDB;
