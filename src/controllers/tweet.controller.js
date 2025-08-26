import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.models.js"
import {User} from "../models/user.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    const userId = req.user._id

    if (!userId) {
    throw new ApiError(404, "User not found");
    }
    if (!content.trim()) {
    throw new ApiError(400, "Content field is required");
    }

    try {
        const tweet = await Tweet.create({
            content,
            owner: userId
        });

        if(!tweet){
            console.log("tweet Creation failed");
            }

        return res
        .status(200)
        .json(ApiResponse(200, tweet, "success"))

    } catch (error) {
        console.log("Tweet creation failed");

        throw new ApiError(400, "Failed to create tweet");
        
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user.id;

    if (!userId) {
        throw new ApiError(404, "User not found...");
    }

    const tweet = await Tweet.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "tweetsDetails",
        },
        },
        {
            $unwind: "$tweetsDetails",
        },
        {
            $project: {
                username: "$tweetsDetails.username",
                createdAt: 1,
                updatedAt: 1,
                content: 1,
      },
    },
  ]);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found...");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "tweets fetched successfully", tweet));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const content = req.body;

    if(!tweetId){
        throw new ApiError(400, "tweetId is required")
    }
    if(!content){
        throw new ApiError(400, "Content is required")
    }

    try {
        
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
        $set: {
            content: content
        }
        },
        {new: true}
    ).select("-password")

    if (!tweet) {
            throw new ApiError(404, "Tweet not found");
        }

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet content updated successfully"))
        
    } catch (error) {
        
        throw new ApiError(400, "Tweet updation failed")
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if (!tweet) {
        throw new ApiError(
        404,
        "Oops! We couldn't find the tweet you're looking for..."
    );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "tweet deleted successfully...", {}));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}