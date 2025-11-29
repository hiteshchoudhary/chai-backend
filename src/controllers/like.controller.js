import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const videoLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (!videoLike) {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    const newLikeVideo = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newLikeVideo, "Like added successfully"));
  }

  await videoLike.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Like removed successfully"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const likeComment = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (!likeComment) {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    const newLikeComment = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, newLikeComment, "Comment like added successfully")
      );
  }

  await likeComment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment like removed successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "tweetId is invalid");
  }

  const likeTweet = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (!likeTweet) {
    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }

    const newLikeTweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, newLikeTweet, "Tweet like added successfully")
      );
  }

  await likeTweet.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet like removed successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos

  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: { $exists: true },
  }).populate("video");

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "All liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
