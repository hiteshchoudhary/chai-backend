import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middlewares.ts";
import { upload } from "../middlewares/multer.middlewares.ts";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  togglePublishStatus,
  updateVideo,
  uploadVideo,
} from "../controllers/video.controller.ts";

const router = Router();

router.use(verifyJwtToken);

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
        name: "thumbnailFile",
        maxCount: 1,
      },
    ]),
    uploadVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(
    upload.fields([
      {
        name: "thumbnailFile",
        maxCount: 1,
      },
    ]),
    updateVideo
  );

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
