import { Router } from "express";
import { 
    changePassword,
    getChannelDetails,
    getUserDetails,
    getWatchHistory,
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser, 
    updateAvatar, 
    updateCoverImage, 
    updateUserDetails
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(authenticate, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(authenticate, changePassword);
router.route("/user-details").get(authenticate, getUserDetails);
router.route("/update-user-details").patch(authenticate, updateUserDetails);
router.route("/update-avatar").patch(authenticate, upload.single("avatar"), updateAvatar);
router.route("/update-coverimage").patch(authenticate, upload.single("coverImage"), updateCoverImage);
router.route("/c/:username").get(getChannelDetails);
router.route("/watch-history").get(authenticate, getWatchHistory);

export default router;