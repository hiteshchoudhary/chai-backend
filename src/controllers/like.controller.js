import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    try {
        const userId = req.user.id;

        // Check if the video exists
        const video = await User.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found")
        }

        const like = await Like.findOne({ video: videoId, likedBy: userId });

        // user has liked the video => dislike video
        if (subscription) {
            await like.remove();
            return res.status(200).json(
                new ApiResponse(200, {}, "Disliked the video.")
            );
        }
        // user has disliked the video => like video
        else {
            await Like.create({
                video: videoId,
                likedBy: userId,
            });

            return res.status(201).json(
                new ApiResponse(200, {}, "Liked video successfully")
            );
        }
    }
    catch (error) {
        console.error("Error toggling like on video:", error);
        return res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    try {
        const userId = req.user.id;

        // Check if the video exists
        const comment = await Comment.findById(commentId);

        if (!comment) {
            throw new ApiError(404, "Comment not found")
        }

        const like = await Like.findOne({ comment: commentId, likedBy: videoId });

        // user has liked the comment => dislike comment
        if (like) {
            await like.remove();
            return res.status(200).json(
                new ApiResponse(200, {}, "Disliked the comment.")
            );
        }
        // user has disliked the comment => like comment
        else {
            await Like.create({
                comment: commentId,
                likedBy: userId,
            });

            return res.status(201).json(
                new ApiResponse(200, {}, "Liked Comment successfully")
            );
        }
    }
    catch (error) {
        console.error("Error toggling like on comment:", error);
        return res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    try {
        const userId = req.user.id;

        // Check if the tweet exists
        const tweet = await Comment.findById(tweetId);

        if (!tweet) {
            throw new ApiError(404, "Tweet not found")
        }

        const like = await Like.findOne({ tweet: tweetId, likedBy: videoId });

        // user has liked the tweet => dislike tweet
        if (like) {
            await like.remove();
            return res.status(200).json(
                new ApiResponse(200, {}, "Disliked the tweet.")
            );
        }
        // user has disliked the tweet => like tweet
        else {
            await Like.create({
                tweet: tweetId,
                likedBy: userId,
            });

            return res.status(201).json(
                new ApiResponse(200, {}, "Liked tweet successfully")
            );
        }
    }
    catch (error) {
        console.error("Error toggling like on tweet:", error);
        return res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }

})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user.id

    try {
        const likedVideos = await Like.find({ likedBy: userId })
            .populate("video", "_id title description owner views")

        res.status(200).json(
            new ApiResponse(200, "Liked videos retrieved: ", likedVideos)
        );

    } catch (error) {
        console.error("Error retrieving liked videos:", error);
        res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}