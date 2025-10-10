import { Router } from "express";
<<<<<<< HEAD
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory, 
    updateAccountDetails
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    )

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router
=======
import {
    loginUser, registerUser, logOutUser, refreshAccessToken, updateAccountDetails1
    , changeCurrentPassword, updateUserAvatar, getcurrentUser, updateUserCoverImage, getUserChannelProfile
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
// upload here is used as middleware to upload these images on the local disk/local Storage 
// So here upload.fields() is used , because we want to upload two things that is avatar and coverImage 
// if there was only one thing to upload we could use  upload.single()
router.route("/register").post(
    upload.fields([{
        name: "avatar",
        maxCount: 1

    },
    {
        name: "coverImage",
        maxCount: 1
    }

    ]),
    registerUser)
router.route("/login").post(loginUser);
// secured routes 
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/updateDetails").patch(verifyJWT, updateAccountDetails1)
router.route("/current-user").get(verifyJWT, getcurrentUser)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
// So for update-avatar , change-password ,update details we need user login to be compulsory  that's why different middlewares like verifyJWT , upload(multer) are used 
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

export default router;
>>>>>>> myrepo/main
