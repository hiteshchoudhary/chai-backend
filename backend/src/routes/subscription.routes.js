import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { authorizeRoles } from '../middlewares/roleCheck.middleware.js';

const router = Router();
router.use(verifyJWT, authorizeRoles("admin", "user")); // Apply verifyJWT middleware to all routes in this file

router
    .route("/c/:channelId")
    .get(getSubscribedChannels)
    .post(toggleSubscription);

router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router
