import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
     if (!videoId) throw new ApiError(404, "Id not found");

     const like = await Like.create({video : videoId, likedBy : req.user})
     if(!like) throw new ApiError(504, "Couldn't create like");

     res
     .status(200)
     .json( new ApiResponse(200, like , "Success"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!commentId) throw new ApiError(404, "Id not found");

    const like = await Like.create({comment : commentId, likedBy : req.user})
    if(!like) throw new ApiError(504, "Couldn't create like");

    res
    .status(200)
    .json( new ApiResponse(200, like , "Success"))

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
     if (!tweetId) throw new ApiError(404, "Id not found");

     const like = await Like.create({tweet : tweetId, likedBy : req.user})
     if(!like) throw new ApiError(504, "Couldn't create like");

     res
     .status(200)
     .json( new ApiResponse(200, like , "Success"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query
    const parsedLimit = parseInt(limit);
    const pageSkip = (page - 1) * parsedLimit;
    const allLikedVideos = await Like.find({video : req.user._id}).skip(pageSkip).limit(parsedLimit);
    if(!allLikedVideos) throw new ApiError(504, "Couldn't find likes video");

     res
     .status(200)
     .json( new ApiResponse(200, allLikedVideos, "Success"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}