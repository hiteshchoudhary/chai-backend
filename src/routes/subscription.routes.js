import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.use(verifyJWT)

router.route('/c/:channelId').get(getsubscribedchannels)
router.route('/u/:subscriberId').get(getuserchannelsubscriber)
router.route('/c/:channelId/subscribe').post(subscribeToaChannel) 
router.route('/c/:channelId/unsubscribe').post(unsubscribeaChannel)

export default router
