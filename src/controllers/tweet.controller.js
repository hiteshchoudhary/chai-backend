import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  let user = await User.findById({ _id: req.user?._id });

  if (!user) {
    throw new ApiError(404, "User not found while creating tweet");
  }

  let tweet = await Tweet.create({
    content: req.body.content,
    owner: user._id,
  });

  if (!tweet) {
    throw new ApiError(404, "Tweet not created");
  }

  res
    .status(200)
    .json(ApiResponse.success(200, { tweet }, "Tweet Created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  let { userId } = req.params;
  let user = await User.findById({ _id: userId });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweets = await Tweet.find({
    owner: user?._id,
  });

  if (tweets.length === 0) {
    throw new ApiError(404, "Tweets not found");
  }

  res
    .status(200)
    .json(ApiResponse.success(200, { tweets }, "Tweets found Successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  let { tweetId } = req.params;
  const tweet = await Tweet.findOne({
    _id: tweetId,
  });

  if (!tweet) {
    throw new ApiError(400, "Tweet not found to update");
  }

  let updatedTweet = await Tweet.findByIdAndUpdate(
    tweet._id,
    { content: req.body.content },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(400, "Tweet is not updated");
  }

  res
    .status(200)
    .json(
      ApiResponse.success(200, { updatedTweet }, "Tweet Updated Successfully")
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const deletedTweet = await Tweet.findByIdAndDelete({ _id: tweetId });

  if (!deletedTweet) {
    return res.status(404).json({ error: "Tweet not found" });
  }

  res
    .status(200)
    .json(
      ApiResponse.success(200, { deletedTweet }, "Tweet deleted successfully")
    );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
