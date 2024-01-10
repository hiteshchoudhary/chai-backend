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
});//working

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  try {
    const { content } = req.body;
    const user = req.user._id;
    const { videoId } = req.params;
    if (!content) throw new ApiError(400, "Missing fields");
    const newComment = await Comment.create({
      content,
      video: videoId,
      owner: user,
    });
    return res
      .status(201)
      .json(new ApiResponse(200, newComment, "Commented added successfull"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  try {
    const { content } = req.body;
    console.log("content", content);
    const { commentId } = req.params;
    console.log("commentId", commentId);

    const user = req.user._id;
    console.log("user", user);

    const result = await Comment.updateOne(
      { _id: commentId, owner: user },
      { $set: { content: content } }
    );
    console.log("result", result);

    if (result.n === 0) {
      throw new ApiError(
        400,
        "Cannot modify others' comment or comment not found"
      );
    }
    const updatedComment = await Comment.findById(commentId);

    return res
      .status(201)
      .json(
        new ApiResponse(200, updatedComment, "Commented updated successfull")
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //Completed

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  try {
    const user = req.user._id;
    const { commentId } = req.params;
    const result = await Comment.findByIdAndDelete({
      _id: commentId,
      owner: user,
    });
    if (result) {
      return res.status(201).json(new ApiResponse(201, "Comment deleted"));
    } else {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            "Comment not found or not owned by the user"
          )
        );
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});//working

export { getVideoComments, addComment, updateComment, deleteComment };
