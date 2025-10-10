import { Router } from 'express';
<<<<<<< HEAD
import {
    getChannelStats,
    getChannelVideos,
} from "../controllers/dashboard.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(getChannelStats);
router.route("/videos").get(getChannelVideos);

export default router
=======
const router = Router();
import { verifyJWT } from "../middlewares/auth.middleware.js"
router.use(verifyJWT);



// router.route("/stats").get(getChannelStats);
// router.route("/videos").get(getChannelVideos);
>>>>>>> myrepo/main
