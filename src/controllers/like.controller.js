import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const videoData = await Like.findOne({ likedBy: req.user._id, video: videoId }).lean()
    let data = null;

    try {
        if (videoData) {
            data = await Like.findOneAndDelete({ video: videoId, likedBy: req.user._id })
        } else {
            data = await Like.create({
                video: videoId,
                likedBy: req.user?._id
            })
        }

        return res
            .status(201)
            .json(new ApiResponse(201, data, `${videoData ? "Un-liked" : "Liked"} successfully`));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Like not updated!!"
        );
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment


    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const commentData = await Like.findOne({ likedBy: req.user._id, comment: commentId }).lean()
    let data = null;

    try {
        if (commentData) {
            data = await Like.findOneAndDelete({ comment: commentId, likedBy: req.user._id })
        } else {
            data = await Like.create({
                comment: commentId,
                likedBy: req.user?._id
            })
        }

        return res
            .status(201)
            .json(new ApiResponse(201, data, `${commentData ? "Un-liked" : "Liked"} successfully`));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Like not updated!!"
        );
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet



    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const tweetData = await Like.findOne({ likedBy: req.user._id, tweet: tweetId }).lean()
    let data = null;

    try {
        if (tweetData) {
            data = await Like.findOneAndDelete({ tweet: tweetId, likedBy: req.user._id })
        } else {
            data = await Like.create({
                tweet: tweetId,
                likedBy: req.user?._id
            })
        }

        return res
            .status(201)
            .json(new ApiResponse(201, data, `${tweetData ? "Un-liked" : "Liked"} successfully`));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Like not updated!!"
        );
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    try {
        const likedVideos = await Like.find({ likedBy: req.user._id }).populate({
            path: "video",
            select: "title videoFile thumbnail duration views"
        })

        return res
            .status(200)
            .json(new ApiResponse(200, likedVideos, `Liked videos fetched successfully`));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Like videos not fetched!!"
        );
    }

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}