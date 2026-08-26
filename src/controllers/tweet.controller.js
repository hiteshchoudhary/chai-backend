import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    try {
        const tweet = await Tweet.create({
            content,
            owner: req.user._id
        })

        await tweet.save();

        return res
            .status(201)
            .json(new ApiResponse(201, tweet, "Tweet created Successfully"));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Tweet not created!!"
        );
    }

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    try {
        const tweets = await Tweet.find({
            owner: req.user._id
        }).lean()

        return res
            .status(201)
            .json(new ApiResponse(201, tweets, "Tweets fetched Successfully"));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Tweet not created!!"
        );
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { content } = req.body
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid video id");
    }

    try {
        const tweet = await Tweet.findByIdAndUpdate({
            owner: req.user._id,
            _id: tweetId
        }, {
            content: content
        }, {
            new: true
        }
        )

        return res
            .status(201)
            .json(new ApiResponse(201, tweet, "Tweet updated Successfully"));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Tweet not updated!!"
        );
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid video id");
    }

    try {
        const tweet = await Tweet.findByIdAndDelete({
            _id: tweetId
        }
        )

        if (!tweet) {
            throw new ApiError(404, "Tweet not found")
        }

        return res
            .status(201)
            .json(new ApiResponse(201, tweet, "Tweet deleted Successfully"));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Tweet not deleted!!"
        );
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
