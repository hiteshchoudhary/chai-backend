import { Router } from 'express';
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import checkValidObjectId from '../middlewares/validateObjectId.middleware.js';

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT); 

router.route("/toggle/v/:videoId")
    .post(checkValidObjectId(['videoId']), toggleVideoLike);

router.route("/toggle/c/:commentId")
    .post(checkValidObjectId(['commentId']), toggleCommentLike);

router.route("/toggle/t/:tweetId")
    .post(checkValidObjectId(['tweetId']), toggleTweetLike);

router.route("/videos").get(getLikedVideos);

export default router;