import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// key learning
// use req.author._id or userid from req.params
// use req.params for models other than users

const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const tweet = await Tweet.create({
      content: content,
      owner: req.author._id,
    });
    if (!tweet) {
        return new ApiError(400, "Tweet not created");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { "tweet_id": tweet._id },
          { "tweet": tweet},
          "Tweet created successfully"
        )
      );
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params;
    if (!userId) {
        throw new ApiError(400, "User id is required")
    }
    const userTweets = await Tweet.find({ owner: userId });
    if (!userTweets) {
        throw new ApiError(400, "User not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, userTweets, "User tweets fetched successfully"));
})

const updateTweet = asyncHandler(async (req, res) => {
    const {content} = req.body
    const {tweetId} = req.params;
   if (!tweetId) {
    throw new ApiError(400, "User id is required");
   }

   const updateTweet = await Tweet.findByIdAndUpdate(
     tweetId,
     { content: content },
     { new: true }
   );

   if (!updateTweet) {
    throw new ApiError(400, "Tweet not updated");
   }

   return res
     .status(200)
     .json(new ApiResponse(200, updateTweet, "Tweet updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deleteTweet) {
        return new ApiError(400, "Tweet not deleted");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, deleteTweet, "Tweet deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
