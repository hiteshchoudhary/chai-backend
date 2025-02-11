import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user.id; // Assuming the user ID is available in req.user

  // Step 1: Validate videoId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Step 2: Check if the user already liked the video
  const existingLike = await Like.findOne({ videoId, userId });

  if (existingLike) {
    // If the like exists, remove it (unlike the video)
    await Like.findOneAndDelete({ videoId, userId });
    return res
      .status(200)
      .json(new ApiResponse(true, null, "Video unliked successfully"));
  } else {
    // If the like doesn't exist, create a new like (like the video)
    const newLike = new Like({
      videoId,
      userId,
    });
    await newLike.save();
    return res
      .status(200)
      .json(new ApiResponse(true, newLike, "Video liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  // Step 1: Validate commentId
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  // Step 2: Check if the user already liked the comment
  const existingLike = await Like.findOne({ commentId, userId });

  if (existingLike) {
    // If the like exists, remove it (unlike the comment)
    await Like.findOneAndDelete({ commentId, userId });
    return res
      .status(200)
      .json(new ApiResponse(true, null, "Comment unliked successfully"));
  } else {
    // If the like doesn't exist, create a new like (like the comment)
    const newLike = new Like({
      commentId,
      userId,
    });
    await newLike.save();
    return res
      .status(200)
      .json(new ApiResponse(true, newLike, "Comment liked successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user.id;

  // Step 1: Validate tweetId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  // Step 2: Check if the user already liked the tweet
  const existingLike = await Like.findOne({ tweetId, userId });

  if (existingLike) {
    // If the like exists, remove it (unlike the tweet)
    await Like.findOneAndDelete({ tweetId, userId });
    return res
      .status(200)
      .json(new ApiResponse(true, null, "Tweet unliked successfully"));
  } else {
    // If the like doesn't exist, create a new like (like the tweet)
    const newLike = new Like({
      tweetId,
      userId,
    });
    await newLike.save();
    return res
      .status(200)
      .json(new ApiResponse(true, newLike, "Tweet liked successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Step 1: Find all likes for the user related to videos
  const likedVideos = await Like.find({
    userId,
    videoId: { $ne: null },
  }).populate("videoId");

  // Step 2: If no videos are liked, return a message
  if (likedVideos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(true, [], "No liked videos found"));
  }

  // Step 3: Return the liked videos
  res
    .status(200)
    .json(
      new ApiResponse(true, likedVideos, "Liked videos retrieved successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
