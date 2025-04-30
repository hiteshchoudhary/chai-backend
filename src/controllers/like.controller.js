import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId,userId} = req.params
    //TODO: toggle like on video
    if(isValidObjectId(videoId) && isValidObjectId(userId)){
        res.status(400).json({
            message: " invalid ids"
        })
    }
    const videoFile = await Like.findOne({
        video: videoId,
        likedBy: userId
    })
    if(videoFile){
        await Like.deleteOne({
            _id: videoFile._id
        })
        res.status(400).json({
            message: "video like removed"
        })
    }else{
        await Like.create({
            video: videoId,
            user: userId
        })
        res.status(400).json({
            message: "video is liked"
        })
    }

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId,userId} = req.params
    //TODO: toggle like on comment
    if(isValidObjectId(commentId) && isValidObjectId(userId)){
        res.status(400).json({
            message: " invalid ids"
        })
    }
    const commentFile = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })
    if(commentFile){
        await Like.deleteOne({
            _id: commentFile._id
        })
        res.status(400).json({
            message: "comment like removed"
        })
    }else{
        await Like.create({
            comment: commentId,
            user: userId
        })
        res.status(400).json({
            message: "comment  is liked"
        })
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId,userId} = req.params
    //TODO: toggle like on tweet
    if(isValidObjectId(tweetId) && isValidObjectId(userId)){
        res.status(400).json({
            message: " invalid ids"
        })
    }
    const tweetfile = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })
    if(tweetfile){
        await Like.deleteOne({
            _id: tweetfile._id
        })
        res.status(400).json({
            message: "tweet like removed"
        })
    }else{
        await Like.create({
            tweet: tweetId,
            user: userId
        })
        res.status(400).json({
            message: "tweet is liked"
        })
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({
        likedBy: userId,
        video: { $exists: true }, 
    }).populate("video"); 

    res.status(200).json({
        message: "Liked videos retrieved successfully",
        likedVideos,
    });
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}