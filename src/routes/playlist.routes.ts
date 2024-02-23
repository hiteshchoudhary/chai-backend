import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middlewares.ts";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getAllPlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  togglePublishStatus,
  updatePlaylist,
} from "../controllers/playlist.controller.ts";

const router = Router();

router.use(verifyJwtToken);

router.route("/").post(createPlaylist).get(getAllPlaylist);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/toggle/publish/:playlistId").patch(togglePublishStatus);

export default router;
