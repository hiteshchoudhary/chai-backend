import { Router } from 'express';
<<<<<<< HEAD
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(getSubscribedChannels)
=======

import { verifyJWT } from "../middlewares/auth.middleware.js"
import { toggleSubscription, getUserChannelSubscribers } from '../controllers/subscription.controller.js';

const router = Router()

router.use(verifyJWT) // Applying verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
>>>>>>> myrepo/main
    .post(toggleSubscription);

router.route("/u/:subscriberId").get(getUserChannelSubscribers);

<<<<<<< HEAD
export default router
=======
export default router
>>>>>>> myrepo/main
