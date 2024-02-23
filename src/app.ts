import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app: Express = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes imports
import userRouter from "./routes/user.routes.ts";
import videoRouter from "./routes/video.routes.ts";
import commentRouter from "./routes/comment.routes.ts";
import subscriptionRouter from "./routes/subscription.routes.ts";
import tweetsRouter from "./routes/tweet.routes.ts";
import likesRouter from "./routes/like.routes.ts";
import playlistRouter from "./routes/playlist.routes.ts";

// Routes declaration
app.use("/api/v1/users", userRouter);

app.use("/api/v1/videos", videoRouter);

app.use("/api/v1/comments", commentRouter);

app.use("/api/v1/subscriptions", subscriptionRouter);

app.use("/api/v1/tweets", tweetsRouter);

app.use("/api/v1/likes", likesRouter);

app.use("/api/v1/playlists", playlistRouter);
// http://localhost:8080/api/v1/user/register

export { app };
