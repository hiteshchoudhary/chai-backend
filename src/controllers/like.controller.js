import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleLike = async (userId, targetId, targetType) => {
  if (!isValidObjectId(targetId)) {
    throw new ApiError(400, `Invalid ${targetType} ID`);
  }

  const existingLike = await Like.findOne({
    user: userId,
    targetId,
    targetType,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return { liked: false };
  } else {
    await Like.create({
      user: userId,
      targetId,
      targetType,
    });
    return { liked: true };
  }
};

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const result = await toggleLike(req.user._id, videoId, "Video");

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Video like toggled successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await toggleLike(req.user._id, commentId, "Comment");

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Comment like toggled successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const result = await toggleLike(req.user._id, tweetId, "Tweet");

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Tweet like toggled successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.find({
    user: req.user._id,
    targetType: "Video",
  }).populate("targetId"); // assuming targetId references Video model

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
};
