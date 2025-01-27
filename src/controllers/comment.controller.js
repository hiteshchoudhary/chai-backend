import mongoose, { isValidObjectId, Mongoose } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  console.log("Video ID:", videoId, "Type:", typeof videoId);

  const videoObjectId = new mongoose.Types.ObjectId(videoId);

  const comments = await Comment.aggregate([
    {
      $match: {
        video: videoObjectId,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "CommentOnWhichVideo",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "OwnerOfComment",
      },
    },

    {
      $project: {
        content: 1,
        owner: {
          $arrayElemAt: ["$OwnerOfComment", 0],
        },
        video: {
          $arrayElemAt: ["$CommentOnWhichVideo", 0],
        },
        createdAt: 1,
      },
    },

    {
      $skip: (page - 1) * parseInt(limit),
    },

    {
      $limit: parseInt(limit),
    },
  ]);
  console.log(comments);

  if (!comments?.length) {
    throw new ApiError(404, "Comments are not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;

  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!req.user) {
    throw new ApiError(401, "User needs to be logged in");
  }

  if (!content) {
    throw new ApiError(400, "Empty or null fields are invalid");
  }

  const addedComment = await Comment.create({
    content,
    owner: req.user?.id,
    video: videoId
  });

  if (!addedComment) {
    throw new ApiError(500, "Something went wrong while adding comment");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, addedComment, videoId, "Comment added successfully")
    );
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  if (!req.user) {
    throw new ApiError(401, "User must be logged in");
  }

  if (!content) {
    throw new ApiError(400, "Comment cannot be empty");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: req.user._id,
    },
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(500, "Something went wrong while updating the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment successfully updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  if (!req.user) {
    throw new ApiError(401, "User must be logged in");
  }

  const deletedCommentDoc = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id,
  });

  if (!deletedCommentDoc) {
    throw new ApiError(500, "Something went wrong while deleting the comment");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedCommentDoc, "Comment deleted successfully")
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
