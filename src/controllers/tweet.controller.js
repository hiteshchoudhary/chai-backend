import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    
    if (!content?.trim()) {
        throw new ApiError(400, "Tweet content not found")
    }

    const owner = req.user._id

    const tweet = await Tweet.create({
        content: content,
        owner: owner
    })

    return res
        .status(200)
        .json(new ApiResponse(201, tweet, "Tweet created successfully!"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    
    if (!userId) {
        throw new ApiError(400, "User not found")
    }

    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid user id")

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 })
    

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "Tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body

    if (!content.trim()) {
        throw new ApiError(400, "No content found for changes")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "Tweet not found.")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(401, "Unauthorized access")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId, 
        {$set: {
            content: content
        }},
        {new: true}
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully."))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.body

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(400, "Tweet not found")
    }

    if (tweet.owner.toString() !== user._id.toString()) {
        throw new ApiError(401, "Unauthorized Access")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    return res  
        .status(200)
        .json(200, deletedTweet, "Tweet deleted successfully.")
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
