import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  incrementVideoViews,
  searchVideos,
  getVideosByUser,
  getRandomVideos,
  getSubscribedVideos,
  getTrendingVideos,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router.route("/search").get(searchVideos);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);
router.route("/random").get(getRandomVideos);
router.route("/trending").get(getTrendingVideos);
router.route("/subscriptions").get(getSubscribedVideos);
router.route("/user/:userId").get(getVideosByUser);
router
  .route("/:videoId")
  .get(incrementVideoViews, getVideoById)
  .delete(deleteVideo)
  .patch(
    upload.fields([{ name: "videoFile" }, { name: "thumbnail" }]),
    updateVideo
  );
export default router;
