import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    if(!videoId?.trim()){
        throw new ApiError(400, "videoId is required")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const userId = req.user._id
    if(!userId?.trim()){
        throw new ApiError(400, "userId is required")
    }
    //check if the user has already liked the video 
    
    const existedLike = await Like.findOne({
        video:videoId,
        likedBy:userId
    })


    //if like does not exist, create it
    if(existedLike){
        await Like.findByIdAndDelete(existedLike._id)
        return res
        .status(200)
        .json(new ApiResponse(200, null, "Video unliked successfully"))
    }

    //if like exists, delete it
    const like = await Like.create({
        video:videoId,
        likedBy:userId
    })

    if(!like){
        throw new ApiError(500, "Failed to toggle like")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, like, "Video liked successfully"))



})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId?.trim()){
        throw new ApiError(400, "commentId is required")
    }
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }
    const userId = req.user._id

    if(!userId?.trim()){
        throw new ApiError(400, "userId is required")
    }

    //check if the user has already liked the comment
    const existedLike = await Like.findOne({
        comment:commentId,
        likedBy:userId
    })

    //if like does exist, toggle it
    if(existedLike){
        const commentLike= await Like.findByIdAndDelete(existedLike._id)
        return res
        .status(200)
        .json(new ApiResponse(200, commentLike, "Comment unliked successfully"))
    }

    //if like does not exist, create it
    const like = await Like.create({
        comment:commentId,
        likedBy:userId
    })

    if(!like){
        throw new ApiError(500, "Failed to toggle like")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, like, "Comment liked successfully"))


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId?.trim()){
        throw new ApiError(400, "tweetId is required")
    }
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id")
    }

    const userId = req.user._id
    
    if(!userId?.trim()){
        throw new ApiError(400, "userId is required")
    }



    //check if the user has already liked the tweet
    const existedLike = await Like.findOne({
        tweet:tweetId,
        likedBy:userId
    })

    //if like does exist, toggle it
    if(existedLike){
        const tweetLike= await Like.findByIdAndDelete(existedLike._id)
        return res
        .status(200)
        .json(new ApiResponse(200, tweetLike, "Tweet unliked successfully"))
    }

    //if like does not exist, create it
    const like = await Like.create({
        tweet:tweetId,
        likedBy:userId
    })

    if(!like){
        throw new ApiError(500, "Failed to toggle like")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, like, "Tweet liked successfully"))


}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}