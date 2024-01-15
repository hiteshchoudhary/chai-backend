import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    registerUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {loginValidator, registerValidator} from '../middlewares/UserDetailsValidator.middleware.js'
const router = Router()

router.route('/register').post(
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
    registerValidator,
    registerUser
)

router.route('/login').post(loginValidator,loginUser)

//secure route
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT,changeCurrentPassword)
router.route('/current-user-details').get(verifyJWT, getCurrentUser)
router.route('/update-account-details').patch(verifyJWT,updateAccountDetails)
router.route('/update-profileimage').patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route('/update-coverimage').patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
//params se data 
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route('/watchhistory').get(verifyJWT, getWatchHistory)



export default router ;
