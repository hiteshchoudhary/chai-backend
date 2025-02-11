import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;

  const userId = req.user.id;

  if (!content || content.trim().length === 0) {
    throw new ApiError(400, "content is required and can not be empty");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const newTweet = new Tweet({
    content,
    userId,
    createdAt: Date.now(),
  });

  await newTweet.save();

  res
    .status(200)
    .json(new ApiResponse(200, newTweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets

  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "Invalid user ID");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const tweets = await Tweet.find({ user: userId }).sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { Id } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === "0") {
    throw new ApiError(400, "Content is required");
  }

  const tweet = await Tweet.findById(Id);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.user.toString() !== req.user.id) {
    throw new ApiError(403, "you are not authorized to update this tweet");
  }

  tweet.content = content;

  await tweet.save();

  res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete

  const { tweetID } = req.params;

  if (!isValidObjectId(tweetID)) {
    throw new ApiError(400, "Invalid Id format");
  }

  const tweet = await Tweet.findById(tweetID);

  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }

  if (req.user.id !== req.tweetID.toString()) {
    throw new ApiError(500, "You are not authorized to delete the tweet");
  }

  await tweet.remove();

  res.status(200).json(
    new ApiResponse({
      success: true,
      message: "tweet deleted successfully",
    })
  );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
