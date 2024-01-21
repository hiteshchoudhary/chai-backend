import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  try {
    const { content } = req.body;

    const userid = req.user._id;
    if (!content) throw new ApiError(404, "Tweets cannot be empty.");
    const createTweet = await Tweet.create({
      owner: userid,
      content: content,
    });
    if (!createTweet)
      throw new ApiError(500, "some error occurred creating tweet.");
    return res
      .status(200)
      .json(
        new ApiResponse(200, { createTweet }, "Successfully created tweet")
      );
  } catch (e) {
    throw new ApiError(400, e.message || "Unable to create tweet");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId)
      throw new ApiError(401, "You do not have permission to Read Tweets");
    const allTweets = await Tweet.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    });
    if (!allTweets) throw new ApiError(500, "Some error occurred");
    return res.status(200).json(new ApiResponse(200, { allTweets }, "Success"));
  } catch (e) {
    throw new ApiError(400, e.message || "Some error occurred getting tweets");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;
    const ownerDetails = await Tweet.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    }).select("-content");
    if (!ownerDetails) throw new ApiError(401, "User not found");
    const updatTweet = await Tweet.updateOne(
      { _id: commentId },
      { $set: { content: content } }
    );
    if (!updatTweet) throw new ApiError(500, "Unable to update tweet");
    return res
      .status(200)
      .json(new ApiResponse(200, { updatTweet }, "Success"));
  } catch (e) {
    throw new ApiError(401, "You are not Authenticated");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;
    const ownerDetails = await Tweet.findOne({
      owner: new mongoose.Types.ObjectId(userId),
    }).select("-content");
    if (!ownerDetails) throw new ApiError(401, "You are not Authenticated");
    const deletedTweet = await Tweet.findByIdAndDelete(commentId);
    if (!deletedTweet) throw new ApiError(500, "Unable to delete");
    return res
      .status(200)
      .json(new ApiResponse(200, { deletedTweet }, "Success"));
  } catch (e) {
    throw new ApiError(401, e.message || "Some error occurred");
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
