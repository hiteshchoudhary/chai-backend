import express from "express";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/:videoId")
  .get(getVideoComments)
  .post(verifyJWT, addComment);

router.route("/update/:commentId")
  .patch(verifyJWT, updateComment);

router.route("/delete/:commentId")
  .delete(verifyJWT, deleteComment);

export default router;
