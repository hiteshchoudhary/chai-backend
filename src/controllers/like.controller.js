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
                    {video: { $exists: true }},
                    {likedBy:new mongoose.Types.ObjectId(req.user._id)}
                ]
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{$first:"$owner"}
                        }
                    }
                ] 
            }
        },
        {
            $addFields:{
                video:{$first:"$video"}
            }
        },
        {
            $project:{
                video:1
            }
        }
    ])

    if (!likedVideos) {
            throw new ApiError(500, `something went wrong while get liked videos`);
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,likedVideos,"get all liked video successfully")
    )
})


const getLikedComments = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedComments = await Like.aggregate([
        {
            $match:{
                $and:[
                    {comment: { $exists: true }},
                    {likedBy:new mongoose.Types.ObjectId(req.user._id)}
                ]
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"comment",
                foreignField:"_id",
                as:"comment",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{$first:"$owner"}
                        }
                    }
                ] 
            }
        },
        {
            $addFields:{
                comment:{$first:"$comment"}
            }
        },
        {
            $project:{
                comment:1
            }
        }
    ])

    if (!likedComments) {
            throw new ApiError(500, `something went wrong while get liked comments`);
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,likedComments,"get all liked comments successfully")
    )
})

const getLikedTweets = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedTweets = await Like.aggregate([
        {
            $match:{
                $and:[
                    {tweet: { $exists: true }},
                    {likedBy:new mongoose.Types.ObjectId(req.user._id)}
                ]
            }
        },
        {
            $lookup:{
                from:"tweets",
                localField:"tweet",
                foreignField:"_id",
                as:"tweet",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullName:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{$first:"$owner"}
                        }
                    }
                ] 
            }
        },
        {
            $addFields:{
                tweet:{$first:"$tweet"}
            }
        },
        {
            $project:{
                tweet:1
            }
        }
    ])

    if (!likedTweets) {
            throw new ApiError(500, `something went wrong while get liked tweets`);
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,likedTweets,"get all liked tweets successfully")
    )
})


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedComments,
    getLikedTweets
}