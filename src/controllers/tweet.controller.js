import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (!content) {
        throw new ApiError(400, "Content not founded");
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    });
    if (!tweet) {
        throw new ApiError(400, "Tweet not created")
    }

    return res.status(200).json(new ApiResponse(200, tweet, "Successfully created the tweet"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const { userId } = req.body

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User id is not valid");
    }

    const pipeline = [
        {
            $match: {
                owner: userId
            }
        }
    ]

    const tweets = await Tweet.aggregate(pipeline);

    if (tweets.length == 0) {
        return res.status(200).json(200, tweets, "not tweet was founded");
    }


    return res.status(200).json(200, tweets, "Successfully founded tweets");

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body


    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweet id is not valid");
    }

    if (!content) {
        throw new ApiError(400, "Content is not found");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {
            content,
        }
    }, { new: true })

    if (!updatedTweet) {
        throw new ApiError(400, "Content is not updated");
    }

    return res.status(200).json(200, updatedTweet, "Successfully updated tweet");


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Tweet id is not valid");
    }

    const deleteTweet = await Tweet.findByIdAndDelete(tweetId, { new: true })

    if (!deleteTweet) {
        throw new ApiError(400, "Tweet is not deleted");
    }

    return res.status(200).json(200, deleteTweet, "Successfully deleted tweet");

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
