import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId, userId } = req.params;

    // Validate inputs
    if (!isValidObjectId(videoId) || !isValidObjectId(userId)) {
        return res.status(400).json({
            message: "Invalid videoId or userId",
        });
    }

    // Check if the like already exists
    const existingLike = await Like.findOne({ video: videoId, likedBy: userId });

    if (existingLike) {
        // If like exists, remove it
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json({
            message: "Video like removed successfully",
        });
    } else {
        // If like doesn't exist, create a new like
        await Like.create({ video: videoId, likedBy: userId });
        return res.status(201).json({
            message: "Video liked successfully",
        });
    }
});

// Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId, userId } = req.params;

    // Validate inputs
    if (!isValidObjectId(commentId) || !isValidObjectId(userId)) {
        return res.status(400).json({
            message: "Invalid commentId or userId",
        });
    }

    // Check if the like already exists
    const existingLike = await Like.findOne({ comment: commentId, likedBy: userId });

    if (existingLike) {
        // If like exists, remove it
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json({
            message: "Comment like removed successfully",
        });
    } else {
        // If like doesn't exist, create a new like
        await Like.create({ comment: commentId, likedBy: userId });
        return res.status(201).json({
            message: "Comment liked successfully",
        });
    }
});

// Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId, userId } = req.params;

    // Validate inputs
    if (!isValidObjectId(tweetId) || !isValidObjectId(userId)) {
        return res.status(400).json({
            message: "Invalid tweetId or userId",
        });
    }

    // Check if the like already exists
    const existingLike = await Like.findOne({ tweet: tweetId, likedBy: userId });

    if (existingLike) {
        // If like exists, remove it
        await Like.deleteOne({ _id: existingLike._id });
        return res.status(200).json({
            message: "Tweet like removed successfully",
        });
    } else {
        // If like doesn't exist, create a new like
        await Like.create({ tweet: tweetId, likedBy: userId });
        return res.status(201).json({
            message: "Tweet liked successfully",
        });
    }
});

// Get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assuming authentication middleware sets req.user

    // Fetch all likes for videos by the user
    const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true } }).populate("video");

    res.status(200).json({
        message: "Liked videos retrieved successfully",
        likedVideos,
    });
});

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
};