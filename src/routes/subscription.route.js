import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {authenticate} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(authenticate); // Apply verifyJWT middleware to all routes in this file

router.route("/c/:channelId").post(toggleSubscription);
router.route("/subscribed-channels/:userId").get(getSubscribedChannels);
router.route("/channel-subscribers/:channelId").get(getUserChannelSubscribers);

export default router