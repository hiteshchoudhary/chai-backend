import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(401, "Video ID is required or invalid");
  }
  page = isNaN(page) ? 1 : Number(page);
  limit = isNaN(limit) ? 10 : Number(limit);
  if (page <= 0) {
    page = 1;
  }
  if (limit <= 0) {
    page = 10;
  }

  const videoComments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentedBy",
        foreignField: "_id",
        as: "commentedBy",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        commentedBy: {
          $first: "$commentedBy",
        },
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, videoComments, "Get video comments success"));
});

const addCommentToVideo = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { videoId } = req.params;
  const { content } = req.body;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(401, "Video ID is required or invalid");
  }

  if (!content || content.trim() === "" || content.trim() === undefined) {
    throw new ApiError(401, "content is required or invalid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const userComment = await Comment.create({
    content: content.trim(),
    video: video._id,
    commentedBy: req.user?._id,
  });

  if (!userComment) {
    throw new ApiError(500, "Something went wrong while posting comment");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userComment, "User commented to video successfully")
    );
});

const addCommentToTweet = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video

  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(401, "Video ID is required or invalid");
  }

  if (!content || content.trim() === "" || content.trim() === undefined) {
    throw new ApiError(401, "content is required or invalid");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }

  const userComment = await Comment.create({
    content: content.trim(),
    tweet: tweet._id,
    commentedBy: req.user?._id,
  });

  if (!userComment) {
    throw new ApiError(500, "Something went wrong while posting comment");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userComment, "User commented to tweet successfully")
    );
});

const getTweetComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { tweetId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(401, "Video ID is required or invalid");
  }

  if (page <= 0) {
    page = 1;
  }
  if (limit <= 0) {
    page = 10;
  }

  const tweetComments = await Comment.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "commentedBy",
        foreignField: "_id",
        as: "commentedBy",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        commentedBy: {
          $first: "$commentedBy",
        },
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  res
    .status(200)
    .json(new ApiResponse(200, tweetComments, "Get tweet comments success"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment

  const { commentId } = req.body;
  const { content } = req.body;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(401, "Video ID is required or invalid");
  }

  if (!content || content.trim() === "" || content.trim() === undefined) {
    throw new ApiError(401, "content is required or invalid");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content: content,
      },
    },
    {
      new: true,
    }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedComment, "Comment is updated successfully")
    );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment

  const { commentId } = req.body;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(401, "Video ID is required or invalid");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new ApiError(500, "Something went wrong while deleting a comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment is deleted successfully"));
});

export {
  getVideoComments,
  getTweetComments,
  addCommentToVideo,
  addCommentToTweet,
  updateComment,
  deleteComment,
};
