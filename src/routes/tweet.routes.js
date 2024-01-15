import { Router } from 'express';
import {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT) // apply middleware to all routes

router.route("/").post(createTweet)
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet)
router.route("/:userId").get(getUserTweets)


export default router