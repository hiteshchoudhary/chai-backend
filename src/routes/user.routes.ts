import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchUserHistory,
} from "../controllers/user.controller.ts";
import { upload } from "../middlewares/multer.middlewares.ts";
import { verifyJwtToken } from "../middlewares/auth.middlewares.ts";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// secured Routes
router.route("/logout").post(verifyJwtToken, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwtToken, changeCurrentPassword);
router.route("/current-user").get(verifyJwtToken, getCurrentUser);

router.route("/update-account").patch(verifyJwtToken, updateAccountDetails);
router
  .route("/update-avatar")
  .patch(
    verifyJwtToken,
    upload.fields([{ name: "avatar", maxCount: 1 }]),
    updateUserAvatar
  );
router
  .route("/update-coverImage")
  .patch(
    verifyJwtToken,
    upload.fields([{ name: "coverImage", maxCount: 1 }]),
    updateUserCoverImage
  );

router.route("/c/:userName").get(verifyJwtToken, getUserChannelProfile);

router.route("/history").get(verifyJwtToken, getWatchUserHistory);

export default router;