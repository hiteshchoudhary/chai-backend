// require('dotenv').config()
import dotenv from "dotenv";
import connectDB from "./db/index.js";


dotenv.config({
    path: "./env"
});

connectDB()



















/*
 Just for demo purpose

( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log("DB Connected");

        app.on("error", (err) => {
            console.error("ERROR: ", error)
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`Listening on PORT: ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("ERROR: ", error)
        throw error
    }
})()

*/