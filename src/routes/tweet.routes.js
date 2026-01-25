import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import checkValidObjectId from '../middlewares/validateObjectId.middleware.js';

const router = Router();

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT); 

router.route("/").post(createTweet);

router.route("/user/:userId")
    .get(checkValidObjectId(['userId']), getUserTweets);

router.route("/:tweetId")
    .patch(checkValidObjectId(['tweetId']), updateTweet)
    .delete(checkValidObjectId(['tweetId']), deleteTweet);

export default router;