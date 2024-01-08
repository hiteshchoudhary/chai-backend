import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  try {
    const comments = await Comment.find({ video: videoId })
      .populate("owner", "username")
      .populate("video", "title");
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedComments = comments.slice(startIndex, endIndex);
    const apiResponse = new ApiResponse(200, {
      totalComments: comments.length,
      currentPage: page,
      totalPages: Math.ceil(comments.length / limit),
      comments: paginatedComments.length > 0 ? paginatedComments : null,
    });
    res.status(200).json(apiResponse);
  } catch (error) {
    throw new ApiError(500, "Something went wrong while fetching comments");
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  try {
    const { content } = req.body;
    const user = req.user._id;
    const { video } = req.params;
    if (!content || !content.text) throw new ApiError(400, "Missing fields");
    const newComment = await Comment.create({ content, video, owner: user });
    return res
      .status(201)
      .json(new ApiResponse(200, newComment, "Commented added successfull"));
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  try {
    const content = req.body;
    const commentId = req.params.id;
    let comment = await Comment.findByIdAndUpdate(commentId);
    const user = req.user._id;
    if (!comment || comment.owner != user) {
      throw new ApiError(400, "Cannot modify others comment");
    }
    comment.content = content;
    comment = await comment.save();
    return res
      .status(201)
      .json(new ApiResponse(200, comment, "Commented updated successfull"));
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  try {
    const user = req.user._id;
    const commentId = req.params;
    let comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(400, "No comment found");
    }
    if (comment.owner !== user) {
      throw new ApiError(400, "invalid user");
    }
    //delete comment
    await Comment.findByIdAndRemove(commentId);
    return res.status(201).json(new ApiResponse(201, "Comment deleted"));
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
});

export { getVideoComments, addComment, updateComment, deleteComment };
