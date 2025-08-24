import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import passport from "passport"
import session from "express-session";


const app = express()


app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))


app.use(session({
  secret: process.env.GOOGLE_SECRET,
  resave: false,
  saveUninitialized: true,
}));


app.use(passport.initialize());
app.use(passport.session())

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// app.get("/", (req, res) => {
//   res.send('<a href="/auth/google">Login with Google</a>');
// });

// app.get("/", (req, res) => {
//   res.send('<a href="/api/v1/users/auth/google">Login with Google</a>');
// });

// razorpay
app.get("/api/v1/getKey", (req,res) => res.status(200).json({key:process.env.RAZORPAY_KEY_ID}))


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
import movieRouter from "./routes/movie.routes.js"
import paymentRouter from "./routes/payment.routes.js"
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
app.use("/api/v1/video/movies", movieRouter)
app.use("/api/v1", paymentRouter)
// http://localhost:8000/api/v1/users/register

export { app }