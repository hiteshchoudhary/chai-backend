import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CreateTweetSchema } from "../schema/tweet.schema.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const requestBodyValidationResult = CreateTweetSchema.safeParse(req.body);

  if (!requestBodyValidationResult.success) {
    throw new ApiError(
      400,
      requestBodyValidationResult.error.errors[0]?.message,
      requestBodyValidationResult.error.errors.map((err) => err.message)
    );
  }

  const { _id } = req.user;
  const requestBody = requestBodyValidationResult.data;

  const tweet = await Tweet.create({
    content: requestBody.content.trim(),
    owner: _id,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      tweet,
    })
  );
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
