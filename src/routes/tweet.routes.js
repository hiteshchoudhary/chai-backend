import { Router } from 'express';
<<<<<<< HEAD
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router
=======
import { createTweet, getUserTweets, updateTweet, deleteTweet } from '../controllers/tweet.controller.js';
import { verifyJWT } from "../middlewares/auth.middleware.js"
const router = Router()
router.use(verifyJWT) // Applying verifyJWT middleware to all routes in this file 

router.route("/").post(createTweet);
//router.route("/tweets").get(getUserTweets);
router.route("/user/:userId").get(getUserTweets);
// If there is no destructing in the controller , while declaring 
// req.params.userId = whatever the value of userId is there in the route 
// router.route("/update").patch();



//This is a little different route 
// At one time, only one method runs (PATCH or DELETE).
// The HTTP method decides the action, not the route path.
// RESTful APIs use the same URL for a resource, and different verbs for actions.
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);
// If there is no destructing in the controller , while declaring 
// so here req.params.tweetId = whatever the value of tweetId is there in the route 

export default router;





>>>>>>> myrepo/main
