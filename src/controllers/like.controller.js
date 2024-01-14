import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { Like } from "../models/like.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const { _id } = req.user;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Provide a valid ObjectID as commentId", [
      "Provide a valid ObjectID as commentId",
    ]);
  }

  const deletedLike = await Like.findOneAndDelete({
    comment: commentId,
    likedBy: _id,
  });

  let createdLike;

  if (!deletedLike) {
    createdLike = await Like.create({
      comment: commentId,
      likedBy: _id,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      liked: !!(!deletedLike && createdLike),
      createdLike,
    })
  );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  const { _id } = req.user;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Provide a valid ObjectID as tweetId", [
      "Provide a valid ObjectID as tweetId",
    ]);
  }

  const deletedLike = await Like.findOneAndDelete({
    tweet: tweetId,
    likedBy: _id,
  });

  let createdLike;

  if (!deletedLike) {
    createdLike = await Like.create({
      tweet: tweetId,
      likedBy: _id,
    });
  }

  return res.status(200).json(
    new ApiResponse(200, {
      liked: !!(!deletedLike && createdLike),
      createdLike,
    })
  );
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
