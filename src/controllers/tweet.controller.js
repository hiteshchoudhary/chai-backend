import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  const userId = req.user._id;
  try {
    if (!content) {
      throw new ApiError(400, "Content field cannot be empty");
    }
    const result = await Tweet.create({ content, owner: userId });
    res.status(201).json(new ApiResponse(200, result, "Tweet created"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  try {
    const { userId } = req.params;
    const result = await Tweet.find({ owner: userId });
    if (!result) {
      throw new ApiError(400, "No tweets found");
    }
    res.status(201).json(new ApiResponse(200, result, "Tweet fetched"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  try {
    const userId = req.user._id;
    const { content } = req.body;
    const { tweetId } = req.params;
    const result = await Tweet.findOneAndUpdate(
      { _id: tweetId, owner: userId },
      { $set: { content: content } }
    );
    if (!result) {
      throw new ApiError(
        403,
        "You don't have permission to perform this action"
      );
    }
    res.status(201).json(new ApiResponse(200, result, "Updated Tweet"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  try {
    const userId = req.user._id;
    const { tweetId } = req.params;
    const result = await Tweet.findOneAndDelete({
      _id: tweetId,
      owner: userId,
    });
    if (result.n === 0) {
      throw new ApiError(
        403,
        "You don't have permission to perform this action"
      );
    }
    res.status(201).json(new ApiResponse(200, result, "Deleted Tweet"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

export { createTweet, getUserTweets, updateTweet, deleteTweet };
