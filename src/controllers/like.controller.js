import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if (!videoId) {
        throw new ApiError(400,"videoId is required");
    }

    const isLiked = await Like.findOne({$and:[
        {likedBy:new mongoose.Types.ObjectId(req.user._id)},
        {video:new mongoose.Types.ObjectId(videoId)}
    ]})

    if (!isLiked) {
        const like = await Like.create({
            likedBy:new mongoose.Types.ObjectId(req.user._id),
            video:new mongoose.Types.ObjectId(videoId)
        })
        if (!like) {
            throw new ApiError(500, `something went wrong while toggle like on video`);
        }
    }else{
        await Like.findByIdAndDelete(isLiked._id)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"video liked successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if (!commentId) {
        throw new ApiError(400,"commentId is required");
    }

    const isLiked = await Like.findOne({$and:[
        {likedBy:new mongoose.Types.ObjectId(req.user._id)},
        {comment:new mongoose.Types.ObjectId(commentId)}
    ]})

    if (!isLiked) {
        const like = await Like.create({
            likedBy:new mongoose.Types.ObjectId(req.user._id),
            comment:new mongoose.Types.ObjectId(commentId)
        })
        if (!like) {
            throw new ApiError(500, `something went wrong while toggle like on comment`);
        }
    }else{
        await Like.findByIdAndDelete(isLiked._id)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"comment liked successfully")
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if (!tweetId) {
        throw new ApiError(400,"tweetId is required");
    }
    const isLiked = await Like.findOne({$and:[
        {likedBy:new mongoose.Types.ObjectId(req.user._id)},
        {tweet:new mongoose.Types.ObjectId(tweetId)}
    ]})

    if (!isLiked) {
        const like = await Like.create({
            likedBy:new mongoose.Types.ObjectId(req.user._id),
            tweet:new mongoose.Types.ObjectId(tweetId)
        })
        if (!like) {
            throw new ApiError(500, `something went wrong while toggle like on tweet`);
        }
    }else{
        await Like.findByIdAndDelete(isLiked._id)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"tweet liked successfully")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.aggregate([
        {
            $match:{
                $and:[
                    {$},
                    {}
                ]
            }
        }
    ])
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}