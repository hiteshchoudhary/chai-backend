import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
<<<<<<< HEAD

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())


//routes import
import userRouter from './routes/user.routes.js'
import healthcheckRouter from "./routes/healthcheck.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

// http://localhost:8000/api/v1/users/register

export { app }
=======
const app = express()
// app.use() is the middleware 
// To handle the cross origin resource sharing 
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
    // many options to explore 
}))

// To handle all type of data 
// To accept the json files 
// To set the limit for json reponses 
app.use(express.json({ limit: "20kb" }))
// To handle the URL 
app.use(express.urlencoded())
// app.use(express.urlencoded({ extended: true }));

// To handle the public assets , which i want to store in my system 
// express.static() is built-in middleware in Express.
// It’s used to serve static files (files that don’t change on the server).
// Example static files: HTML, CSS, JavaScript, images, fonts, PDFs.
app.use(express.static("public"))

// To do the CRUD operation on the cookies 
app.use(cookieParser())


// routes import 
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'

// routes declaration 
// Through this middleware 
//what we are doing is , whenever a user enters "/users"
// The controll will go to the  'userRouter'
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweet", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
// so we have created till here 
// after that controll is passed to userRouter in file user.routes.js
// http://localhost:8000/api/v1/users/ 

export { app };
>>>>>>> myrepo/main
