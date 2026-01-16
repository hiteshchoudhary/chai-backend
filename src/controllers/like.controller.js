import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const deltedLike=await Like.findOneAndDelete(
        {
            likedItem:videoId,
            likedItemModel:"Video",
            likedBy:req.user._id
        }
    )
    if(!deltedLike){
    const newVideoLikeStatus=await Like.create(
        {
            likedItem:videoId,
            likedItemModel:"Video",
            likedBy:req.user._id
        }
    )
    return res.status(201).json(new ApiResponse(200,newVideoLikeStatus,"video liked successfully"))
    }
    else{
        return res.status(200).json(new ApiResponse(200,deltedLike,"video unliked successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const deltedLike=await Like.findOneAndDelete(
        {
            likedItem:commentId,
            likedItemModel:"Comment",
            likedBy:req.user._id
        }
    )
    if(!deltedLike){
    const newVideoLikeStatus=await Like.create(
        {
            likedItem:commentId,
            likedItemModel:"Comment",
            likedBy:req.user._id
        }
    )
    return res.status(201).json(new ApiResponse(200,newVideoLikeStatus,"comment liked successfully"))
    }
    else{
        return res.status(200).json(new ApiResponse(200,deltedLike,"comment unliked successfully"))
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const deltedLike=await Like.findOneAndDelete(
        {
            likedItem:tweetId,
            likedItemModel:"Tweet",
            likedBy:req.user._id
        }
    )
    if(!deltedLike){
    const newVideoLikeStatus=await Like.create(
        {
            likedItem:tweetId,
            likedItemModel:"Tweet",
            likedBy:req.user._id
        }
    )
    return res.status(201).json(new ApiResponse(200,newVideoLikeStatus,"Tweet liked successfully"))
    }
    else{
        return res.status(200).json(new ApiResponse(200,deltedLike,"Tweet unliked successfully"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    //TODO: apply pagination for this plz
    const likedVideos=await Like.aggregate([
        {
            $match:{
                likedItemModel:"Video",
                likedBy:req.user._id
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"likedItem",
                foreignField:"_id",
                as:"likedVideo",
                pipeline:[
                    {
                        $match:{
                            isPublished:true
                        }
                    },
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $project:{
                            thumbnail:1,
                            title:1,
                            owner:1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                likedVideo:1
            }
        }
    ])
    res.status(200).json(new ApiResponse(200,likedVideos,"liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}