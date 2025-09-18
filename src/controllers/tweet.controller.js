import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const content = req.body?.content;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  if (content.length > 280) {
    throw new ApiError(400, "Content exceeds maximum length of 280 characters");
  }
  const userId = req.user._id;

  const tweet = new Tweet({ content, owner: userId });
  await tweet.save();
  res
    .status(201)
    .json(new ApiResponse(201, "Tweet created successfully", tweet));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const tweet = await Tweet.aggregatePaginate([
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
    },
  ]);
  if (!tweet.docs[0]) {
    throw new ApiError(404, "no tweets found");
  }
  res
    .status(200)
    .json(new ApiResponse(200, "Tweet fetched successfully", tweet));
});

export const getTweetById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  console.log('id',new mongoose.Types.ObjectId(id));
  
  // const tweet = await Tweet.aggregatePaginate(
  //   [
  //     {
  //       $match: { _id: new mongoose.Types.ObjectId(id) },
  //     },
  //   ],
  //   { populate: { path: "owner", select: "username avatar" } }
  // );
  // if (!tweet.docs[0]) {
  //   throw new ApiError(404, "Tweet not found");
  // }

  const tweet = await Tweet.findById(id);
  // console.log('tweet',tweet.docs);
  
  res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const userId = req.user._id;
  const content = req.body?.content;
  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  if (content.length > 280) {
    throw new ApiError(400, "Content exceeds maximum length of 280 characters");
  }
  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  if (!tweet.validateUser(userId)) {
    throw new ApiError(403, "You are not authorized to update this tweet");
  }
  if (tweet.content === content)
    throw new ApiError(409, "This content is already present");
  tweet.content = content;
  await tweet.save();
  res
    .status(200)
    .json(new ApiResponse(200, "Tweet updated successfully", tweet));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }
  if (!tweet.validateUser(userId)) {
    throw new ApiError(403, "You are not authorized to delete this tweet");
  }
  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);
  res
    .status(200)
    .json(new ApiResponse(200, "Tweet deleted successfully", deletedTweet));
});

const getTweets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: { path: "owner", select: "username avatar" },
  };
  const tweets = await Tweet.aggregatePaginate(
    [
      {
        $match: {},
      },
    ],
    options
  );

  res
    .status(200)
    .json(new ApiResponse(200, "Tweets fetched successfully", tweets));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet, getTweets };
