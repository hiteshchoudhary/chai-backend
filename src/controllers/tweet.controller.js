import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // Get tweet details
  // Perform validation that all fields are present or not
  // Check whether correct user Id is passed or not
  // Now create the tweet against this user
  // Return the response if tweet is created successfully

  const { content, owner } = req.body;
  console.log("req.body => ", content, owner);

  if (!content && !owner) {
    throw new ApiError(500, "tweet content and owner details are missing !");
  }

  if (!isValidObjectId(owner)) {
    throw new ApiError(500, `Malformatted Owner Id ${videoId}`);
  }

  // Here owner represents the userId
  const user = await User.findById(owner);

  console.log("tweet user =>", user);

  if (!user) {
    res
      .status(404)
      .json(new ApiResponse(404, {}, `User with ${owner} not found !`));
  }

  // User is present and content is also present so create the tweet.
  const tweet = await Tweet.create({
    content,
    owner,
  });

  if (!tweet) {
    throw new ApiError(500, "Something went wrong while creating the tweet !");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, tweet, `Tweet created successfully.`));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  // Find the user based on id, and if found, find all the tweets of that user.

  const { userId } = req.params;

  console.log("userId for getting userTweets => ", userId);

  if (!userId) {
    throw new ApiError(500, "User id missing !");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(500, `Malformatted User Id ${userId}`);
  }

  const user = await User.findById(userId);

  console.log("foundUser for getting tweets => ", user);

  if (!user) {
    res
      .status(404)
      .json(new ApiResponse(404, {}, `No user found with id ${userId}!`));
  }

  const tweets = await Tweet.find({
    owner: userId,
  });

  console.log("tweets => ", tweets);

  if (!tweets || tweets.length === 0) {
    res
      .status(404)
      .json(
        new ApiResponse(404, {}, "No tweets found for the following user !")
      );
  } else {
    res
      .status(200)
      .json(
        new ApiResponse(200, tweets, "Tweets for the following user found.")
      );
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { tweetId } = req.params;
  const { content } = req.body;

  if (!tweetId) {
    throw new ApiError(500, "Tweet Id is missing !");
  }

  if (!content) {
    throw new ApiError(500, "Content is required to update the tweet !");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(500, `Malformatted Tweet Id ${tweetId}`);
  }

  console.log("req.user =>", req.user);

  // Tweet id is present and user is also logged in
  const updatedTweetObj = {
    content,
  };

  const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, updatedTweetObj, {
    new: true,
  });

  console.log("updated Tweet => ", updateTweet);

  if (!updatedTweet) {
    throw new ApiError(
      500,
      `Unable to update tweet because with id ${tweetId} !`
    );
  } else {
    res
      .status(200)
      .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully."));
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  console.log("tweetId for deleting Tweet => ", tweetId);

  if (!tweetId) {
    throw new ApiError(500, "Tweet Id missing !");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(500, `Malformatted Tweet Id ${tweetId}`);
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  console.log("tweet to be Deleted => ", tweet);

  if (!tweet) {
    throw new ApiError(
      500,
      `Error occured while deleting tweet with id ${tweetId} !`
    );
  } else {
    res.status(200).json(new ApiResponse(200, "Tweet deleted successfully."));
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
Footer;
