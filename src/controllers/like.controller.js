import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

/**
 * Like Controller - Handles like/unlike operations
 * 
 * This controller manages likes on different entities:
 * - Videos
 * - Comments
 * - Tweets
 * 
 * Features:
 * - Toggle like/unlike (if already liked, unlike it; if not liked, like it)
 * - Get all videos liked by a user
 * - Validates entity existence before liking
 */

/**
 * toggleVideoLike - Toggle like on a video
 * 
 * Features:
 * - If video is already liked by user, removes the like (unlike)
 * - If video is not liked, adds a like
 * - Validates video exists
 * 
 * Process:
 * 1. Validate videoId
 * 2. Check if video exists
 * 3. Check if user already liked the video
 * 4. If liked, delete the like (unlike)
 * 5. If not liked, create a new like
 * 6. Return appropriate response
 */
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check if user already liked the video
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        // Unlike: Remove the like
        await Like.findByIdAndDelete(existingLike._id)
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLiked: false },
                    "Video unliked successfully"
                )
            )
    } else {
        // Like: Create new like
        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLiked: true, like },
                    "Video liked successfully"
                )
            )
    }
})

/**
 * toggleCommentLike - Toggle like on a comment
 * 
 * Features:
 * - If comment is already liked by user, removes the like (unlike)
 * - If comment is not liked, adds a like
 * - Validates comment exists
 * 
 * Process:
 * 1. Validate commentId
 * 2. Check if comment exists
 * 3. Check if user already liked the comment
 * 4. If liked, delete the like (unlike)
 * 5. If not liked, create a new like
 * 6. Return appropriate response
 */
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    // Validate commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // Check if comment exists
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // Check if user already liked the comment
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {
        // Unlike: Remove the like
        await Like.findByIdAndDelete(existingLike._id)
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLiked: false },
                    "Comment unliked successfully"
                )
            )
    } else {
        // Like: Create new like
        const like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLiked: true, like },
                    "Comment liked successfully"
                )
            )
    }
})

/**
 * toggleTweetLike - Toggle like on a tweet
 * 
 * Features:
 * - If tweet is already liked by user, removes the like (unlike)
 * - If tweet is not liked, adds a like
 * - Validates tweet exists
 * 
 * Process:
 * 1. Validate tweetId
 * 2. Check if tweet exists
 * 3. Check if user already liked the tweet
 * 4. If liked, delete the like (unlike)
 * 5. If not liked, create a new like
 * 6. Return appropriate response
 */
const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    // Check if tweet exists
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    // Check if user already liked the tweet
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {
        // Unlike: Remove the like
        await Like.findByIdAndDelete(existingLike._id)
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLiked: false },
                    "Tweet unliked successfully"
                )
            )
    } else {
        // Like: Create new like
        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isLiked: true, like },
                    "Tweet liked successfully"
                )
            )
    }
})

/**
 * getLikedVideos - Get all videos liked by the current user
 * 
 * Features:
 * - Returns paginated list of liked videos
 * - Includes video details and owner information
 * - Sorted by most recently liked first
 * 
 * Process:
 * 1. Find all likes by user on videos
 * 2. Populate video details
 * 3. Populate video owner information
 * 4. Return list of liked videos
 */
const getLikedVideos = asyncHandler(async (req, res) => {
    // Find all video likes by the current user
    const likes = await Like.find({
        likedBy: req.user._id,
        video: { $exists: true } // Only video likes
    }).populate({
        path: "video",
        populate: {
            path: "owner",
            select: "username fullName avatar"
        }
    })

    // Filter out any null videos (in case video was deleted)
    const likedVideos = likes
        .filter(like => like.video !== null)
        .map(like => like.video)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "Liked videos fetched successfully"
            )
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}