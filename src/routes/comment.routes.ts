import { Router } from "express";
import { verifyJwtToken } from "../middlewares/auth.middlewares.ts";
import {
  addComment,
  deleteComment,
  getVideoComment,
  updateComment,
} from "../controllers/comment.controller.ts";

const router = Router();

router.use(verifyJwtToken);

router.route("/:videoId").post(addComment).get(getVideoComment);

router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router;
