import dotenv from "dotenv";
import connectDB from "./db/index.ts";
import { app } from "./app.ts";

dotenv.config({
  path: "./.env",
});
const PORT: Number = Number(process.env.PORT) || 7000;

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log(error);
      throw error;
    });

    app.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`);
    });
  })
  .catch((error: Error) => {
    console.log("MONGODB Connection Failed !!! : ", error);
  });

/*
import express from "express";
const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log(error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.log(error);
    throw error;
  }
})();
*/
