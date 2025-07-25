import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  console.log("query", req.query);

  if (!videoId || !isValidObjectId(videoId)) {
    return new ApiError(400, "Missing or Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "No such video found");
  }

  const pipeline = [
    // match the comments of the video
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    // populate the user details to it
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    // convert the createdBy array to object
    {
      $addFields: {
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $unwind: "$createdBy",
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $project: {
        content: 1,
        createdBy: 1,
        updatedAt: 1,
      },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    pagination: true,
  };

  const aggregateQuery = Comment.aggregate(pipeline);

  if (!aggregateQuery) {
    return next(new ApiError(404, "no comments found fot this video"));
  }

  const result = await Comment.aggregatePaginate(aggregateQuery, options);

  if (!result || result.docs?.length === 0) {
    throw new ApiError(404, "No comments found for this video");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalDocs: result.totalDocs,
        count: result.docs?.length,
        totalComments: result.docs,
        totalPages: result.totalPages,
        currentPage: result.page,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
        nextPage: result.nextPage,
        prevPage: result.prevPage,
        pagingCounter: result.pagingCounter,
      },
      "Comments fetched successfully"
    )
  );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  const { comment } = req.body;

  const userID = req.user._id;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Missing or Invalid video ID");
  }

  if (!comment || comment.trim() === "") {
    throw new ApiError(400, "Please write something for comment");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video does not exits");
  }

  const newComment = await Comment.create({
    content: comment,
    video: videoId,
    owner: userID,
  });

  if (!newComment) {
    throw new ApiError(400, "Failed to create a comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "Comment added"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Missing or Invalid comment Id");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Provide a content for comment");
  }

  const userID = req.user._id;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  if (!comment.owner.equals(userID)) {
    throw new ApiError(403, "You are not allowed to update this comment");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(400, "Failed to update the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Missing or Invalid comment Id");
  }

  const userID = req.user._id;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  if (!comment.owner.equals(userID)) {
    throw new ApiError(403, "You are not allowed to delete this comment");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(400, "Failed to delete the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleteComment, "Comment deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
