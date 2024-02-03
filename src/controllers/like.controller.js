import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on video
  const { videoId } = req.params;
  const user = req.user;

  // User unliking a video
  let unlike = await Like.findOneAndDelete({
    likedBy: user._id,
    video: videoId,
  });

  if (unlike) {
    res
      .status(200)
      .json(new ApiResponse(200, { unlike }, "Video unliked successfully"));
  } else {
    // User liking a video
    let like = await Like.create({
      video: videoId,
      likedBy: user?._id,
    });

    if (like) {
      res
        .status(200)
        .json(new ApiResponse(200, { like }, "Video liked successfully"));
    } else {
      throw new ApiError(403, "You don't have permission to like this video");
    }
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  const user = req.user;

  // User unliking a comment
  let unlike = await Like.findOneAndDelete({
    likedBy: user._id,
    comment: commentId,
  });

  if (unlike) {
    res
      .status(200)
      .json(new ApiResponse(200, { unlike }, "Comment unliked successfully"));
  } else {
    // User liking a comment
    let like = await Like.create({
      comment: commentId,
      likedBy: user?._id,
    });

    if (like) {
      res
        .status(200)
        .json(new ApiResponse(200, { like }, "comment liked successfully"));
    } else {
      throw new ApiError(404, "You can't like this comment");
    }
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  const user = req.user;

  // User unliking a Tweet
  let unlike = await Like.findOneAndDelete({
    tweet: tweetId,
    likedBy: user._id,
  });

  if (unlike) {
    res
      .status(200)
      .json(new ApiResponse(200, { unlike }, "Tweet unliked successfully"));
  } else {
    // User liking a Tweet
    let like = await Like.create({
      tweet: tweetId,
      likedBy: user?._id,
    });

    if (like) {
      res
        .status(200)
        .json(new ApiResponse(200, { like }, "Tweet liked successfully"));
    } else {
      throw new ApiError(404, "You can't like this Tweet");
    }
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  let user = req.user;
  
  let likedVideos = await Like.find({
    video: { $exists: true },
    likedBy: user._id,
  });

  if (likedVideos.length == 0) {
    throw new ApiError(404, "User have no liked video");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likedVideos },
        "Successfully fetched all liked videos"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
