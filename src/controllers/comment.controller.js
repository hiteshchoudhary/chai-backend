import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video doesn't exist");
  }

  const comments = await Comment.find({ video: videoId })
    .skip(skip)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const totalComments = await Comment.countDocuments({ video: videoId });

  const totalPages = Math.ceil(totalComments / limit);

  return res(200).json(
    new ApiResponse(
      200,
      { video, comments, totalComments, totalPages, currentPage: page },
      "Comment fetuched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { text } = req.body;

  if (!text || text.trim() === "") {
    throw new ApiError(400, "Comment text is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found!");
  }

  const newComments = new Comment({
    text,
    video: videoId,
    user: req.user._id,
    createdAt: new Date(),
  });

  await newComments.save();

  res
    .status(201)
    .json(new ApiResponse(201, newComments, "Comment added Successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { commentText } = req.body;

  if (!commentText || !commentText.trim() === "") {
    throw new ApiError(400, "Comment can't be empty");
  }

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "comment doesn't exist");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (req.user._id.toString() !== comment.user.toString()) {
    throw new ApiError(403, "you can only update your comment");
  }

  comment.commentText = commentText;

  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID!");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "comment not found");
  }

  if (!req.user._id.toString() !== comment.user.toString()) {
    throw new ApiError(403, "You can only delete you comments");
  }

  await comment.remove();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
