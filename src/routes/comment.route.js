import { Router } from "express";
import {
  addCommentToTweet,
  addCommentToVideo,
  deleteComment,
  getTweetComments,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authenticate); // Apply verifyJWT middleware to all routes in this file

router.route("/v/:videoId").get(getVideoComments).post(addCommentToVideo);
router.route("/t/:tweetId").get(getTweetComments).post(addCommentToTweet);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
