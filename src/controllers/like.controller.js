import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoID")
    }

    const isLiked = await Like.findOne({ video: videoId, likedBy: req.user._id });

    if (!isLiked) {
        const like = await Like.create({
            video: videoId,
            likedBy: req.user._id
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, like, "Liked the Video")
            )

    } else {
        const like = await isLiked.deleteOne();
        return res
            .status(200)
            .json(
                new ApiResponse(200, like, "Unliked the Video")
            )
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid CommentId")
    }

    const isLiked = await Like.findOne({ comment: commentId, likedBy: req.user._id });

    if (!isLiked) {
        const like = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, like, "Liked the Comment")
            )

    } else {
        const like = await isLiked.deleteOne();
        return res
            .status(200)
            .json(
                new ApiResponse(200, like, "Unliked the Comment")
            )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const isLiked = await Like.findOne({ tweet: tweetId, likedBy: req.user._id });

    if (!isLiked) {
        const like = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, like, "Liked the Tweet")
            )

    } else {
        const like = await isLiked.deleteOne();
        return res
            .status(200)
            .json(
                new ApiResponse(200, like, "Unliked the Tweet")
            )
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: {
                    $exists: true
                }
            }
        }, {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        }, {
            $lookup: {
                from: "users",
                localField: "likedBy",
                foreignField: "_id",
                as: "channel"
            }
        }, { 
            $unwind: "$videoDetails" 
        }, {
            $project: {
                _id: 0,
                likedAt: "$createdAt",
                videoDetails: 1,
                channel: {
                    username: { $getField: { field: "username", input: { $arrayElemAt: ["$channel", 0] } } },
                    avatar: { $getField: { field: "avatar", input: { $arrayElemAt: ["$channel", 0] } } }
                }
            }
        }
    ]);

    if(!likedVideos){
        throw new ApiError(400, "Liked Videos Fetching Failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, likedVideos, "All Liked Videos")
    )

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}