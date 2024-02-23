import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middlewares.ts";
import {
  getChannelSubscribers,
  getUserChannelSubscribers,
  getUserSubscribedChannels,
  toggleSubscription,
} from "../controllers/subscription.controller.ts";

const router = Router();
router.use(verifyJwtToken);

router
  .route("/c/:channelId")
  .post(toggleSubscription)
  .get(getChannelSubscribers);

router.route("/user/channels-list").get(getUserSubscribedChannels);

router.route("/user/subscriber").get(getUserChannelSubscribers);

export default router;