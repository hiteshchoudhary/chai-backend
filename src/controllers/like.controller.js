import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user?._id

    if(isValidObjectId(videoId) === false){
        throw new ApiError(400, "Invalid video id")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    existingLike ? await Like.findByIdAndDelete(existingLike?._id) : await Like.create({
        video: videoId,
        likedBy: userId
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked: existingLike?false:true}, existingLike? "Removed like" : "Added like"))   
     //TODO: toggle like on video
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user?._id

    if(isValidObjectId(commentId) === false){
        throw new ApiError(400, "Invalid comment id")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })
    existingLike ? await Like.findByIdAndDelete(existingLike?._id) : await Like.create({
        comment: commentId,
        likedBy: userId
    })

    return res
    .status(200)
    .json(new ApiResponse(200, {isLiked: existingLike? false : true}, existingLike? "Removed Comment Like": "Added Comment like"))
    //TODO: toggle like on comment
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user?._id

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Tweet Id")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId, 
        likedBy: userId
    })

    existingLike? await Like.findByIdAndDelete(existingLike?._id) : await Like.create({
        tweet: tweetId,
        likedBy: userId
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{isLiked: existingLike? false: true},existingLike? "Tweet Like Removed" : "Tweet Like Added"))
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    const getAllLikedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: {$exists: true} //Our Like model can have likes for videos, comments and tweets; not necessarily all of them but any one of them. So even if the User liked a comment but not the Video, without this condition it would fetch the Like document for the User and resulting in error as no video is associated with that Like document.
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $project:{
                            refreshToken: 0,
                            password: 0,
                            createdAt: 0,
                            updatedAt: 0,
                        }
                    }
                ]
            }   
        },
        {
            $addFields:{
                "videoDetails": {$arrayElementAt: ["$videoDetails",0]}
            }
        }
    ]) 

    return res
    .status(200)
    .json( new ApiResponse(200, {likedVideos: getAllLikedVideos}, "Fetched liked videos"))    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}