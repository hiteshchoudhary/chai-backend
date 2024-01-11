import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  const userId = req.user._id;

  if (!isValidObjectId(userId)) throw new ApiError("User not found");
  if (!isValidObjectId(videoId)) throw new ApiError("Video not found");

  const isLiked = await Like.findOne({
    isLiked: new mongoose.Types.ObjectId(userId),
    video: new mongoose.Types.ObjectId(userId),
  });

  if (!isLiked) {
    await Like.create({
      isLiked: userId,
      video: videoId,
    });
  } else {
    await Like.deleteOne(isLiked);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video unlike successfully"));
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video Liked Fetching Successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  const userId = req.user._id;

  if (!isValidObjectId(userId) || !isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid User or Video");
  }

  const comment = await Like.findOne({
    likedBy: new mongoose.Types.ObjectId(userId),
    comment: new mongoose.Types.ObjectId(commentId),
  });

  if (comment) {
    await Like.deleteOne(comment);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "comment unlike Successfully"));
  } else {
    await Like.create({
      likedBy: userId,
      comment: commentId,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment Liked Successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  const userId = req.user._id;

  if (!isValidObjectId(userId) || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid User or Tweet ID");
  }

  const tweetLike = await Like.findOne({
    likedBy: new mongoose.Types.ObjectId(userId),
    tweet: new mongoose.Types.ObjectId(tweetId),
  });

  if (tweetLike) {
    await Like.deleteOne(tweetLike);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet unlike Successfully"));
  } else {
    await Like.create({
      likedBy: userId,
      tweet: tweetId,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet Liked Successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid User or Video");
  }

  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(userId),
        video: { $exists: true },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "AllVideos",
      },
    },
    {
      $unwind: {
        path: "$AllVideos",
      },
    },
    {
      $project: {
        _id: "$AllVideos._id",
        title: "$AllVideos.title",
        videoFile: "$AllVideos.videoFile",
        createdAt: "$AllVideos.createdAt",
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "All Liked videos Fetched Successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
