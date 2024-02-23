import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middlewares.ts";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.ts";

const router = Router();

router.use(verifyJwtToken);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/likedVideos").get(getLikedVideos);

export default router;