import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/c/:channelId")
  .get(getUserChannelSubscribers) // Here instead of getSubscribedChannels, getUserChannelSubscibers should be there, becasue based on channel Id we will fetch the subscribers.
  .post(toggleSubscription);

router.route("/u/:subscriberId").get(getSubscribedChannels);
// Here instead of getUserChannelSubscibers, getSubscribedChannels should be there, becasue based on subscriber Id we will fetch the subscribed channels.

export default router;
