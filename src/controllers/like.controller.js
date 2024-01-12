import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  try {
    const userId = req.user._id;
    const conditions = { likedBy: userId, video: videoId };
    const like = await Like.findOne(conditions);
    //check karlo ki videoId valid hai ya nahii
    const isVideoIdValid = await Video.findById(videoId);
    if (!isVideoIdValid) {
      throw new ApiError(404, "Video not found");
    }
    if (!like) {
      const newLike = await Like.create({ video: videoId, likedBy: userId });
      return res
        .status(200)
        .json(new ApiResponse(201, newLike, "Liked successfully"));
    } else {
      const removeLike = await Like.findOneAndDelete(conditions);
      return res
        .status(200)
        .json(new ApiResponse(201, removeLike, "Removed like successfully"));
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const userId = req.user._id;
  //TODO: toggle like on comment
  try {
    const conditions = { likedBy: userId, comment: commentId };
    const like = await Like.findOne(conditions);
    //Comment ki validity check karo
    const isCommentIdValid = await Comment.findById(commentId);
    if (!isCommentIdValid) {
      throw new ApiError(404, "Comment not found");
    }
    if (!like) {
      const newLike = await Like.create({
        comment: commentId,
        likedBy: userId,
      });
      return res
        .status(200)
        .json(new ApiResponse(201, newLike, "Liked successfully"));
    } else {
      const removeLike = await Like.findOneAndDelete(conditions);
      return res
        .status(200)
        .json(new ApiResponse(201, removeLike, "Removed like successfully"));
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;
  //TODO: toggle like on tweet
  try {
    const conditions = { likedBy: userId, tweet: tweetId };
    const like = await Like.findOne(conditions);
    //Tweet ki validity check karo
    const isTweetIdValid = await Tweet.findById(tweetId);
    if (!isTweetIdValid) {
      throw new ApiError(404, "Tweet not found");
    }
    if (!like) {
      const newLike = await Like.create({
        tweet: tweetId,
        likedBy: userId,
      });
      return res
        .status(200)
        .json(new ApiResponse(201, newLike, "Liked successfully"));
    } else {
      const removeLike = await Like.findOneAndDelete(conditions);
      return res
        .status(200)
        .json(new ApiResponse(201, removeLike, "Removed like successfully"));
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  try {
    const userId = req.user._id;
    const likedVideos = await Like.find({
      likedBy: userId,
      video: { $ne: null },
    });
    if (!likedVideos) {
      throw new ApiError(404, "No videos found");
    }
    res
      .status(201)
      .json(new ApiResponse(200, likedVideos, "Fetched successfull"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
