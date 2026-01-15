import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

/**
 * Tweet Controller - Handles tweet operations
 * 
 * This controller manages tweets including:
 * - Creating tweets
 * - Getting user tweets
 * - Updating tweets
 * - Deleting tweets
 */

/**
 * createTweet - Create a new tweet
 * 
 * Features:
 * - Validates tweet content
 * - Associates tweet with current user
 * - Creates tweet document
 * 
 * Process:
 * 1. Validate content is provided
 * 2. Create tweet document
 * 3. Return created tweet with owner details
 * 
 * Required Body:
 * - content: Tweet text content
 */
const createTweet = asyncHandler(async (req, res) => {
    const {content} = req.body

    // Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required")
    }

    // Create tweet
    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    // Fetch created tweet with owner details
    const createdTweet = await Tweet.findById(tweet._id).populate(
        "owner",
        "username fullName avatar"
    )

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdTweet,
                "Tweet created successfully"
            )
        )
})

/**
 * getUserTweets - Get all tweets by a specific user
 * 
 * Features:
 * - Returns all tweets for a user
 * - Includes owner information
 * - Sorted by newest first
 * 
 * Process:
 * 1. Validate userId
 * 2. Check if user exists
 * 3. Find all tweets by user
 * 4. Populate owner information
 * 5. Return tweets list
 */
const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Check if user exists
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    // Find all tweets by user, sorted by newest first
    const tweets = await Tweet.find({
        owner: userId
    })
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                tweets,
                "User tweets fetched successfully"
            )
        )
})

/**
 * updateTweet - Update an existing tweet
 * 
 * Features:
 * - Only tweet owner can update
 * - Validates tweet ownership
 * - Updates tweet content
 * 
 * Process:
 * 1. Validate tweetId
 * 2. Check if tweet exists
 * 3. Verify user is the owner
 * 4. Validate new content
 * 5. Update tweet
 * 6. Return updated tweet
 * 
 * Required Body:
 * - content: Updated tweet text
 */
const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {content} = req.body

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    // Find tweet
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // Check if user is the owner
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own tweets")
    }

    // Validate content
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required")
    }

    // Update tweet
    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content: content.trim()
            }
        },
        {
            new: true
        }
    ).populate("owner", "username fullName avatar")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedTweet,
                "Tweet updated successfully"
            )
        )
})

/**
 * deleteTweet - Delete a tweet
 * 
 * Features:
 * - Only tweet owner can delete
 * - Validates tweet ownership
 * 
 * Process:
 * 1. Validate tweetId
 * 2. Check if tweet exists
 * 3. Verify user is the owner
 * 4. Delete tweet
 * 5. Return success response
 */
const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    // Find tweet
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // Check if user is the owner
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own tweets")
    }

    // Delete tweet
    await Tweet.findByIdAndDelete(tweetId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Tweet deleted successfully"
            )
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
