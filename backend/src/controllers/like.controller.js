import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js"
import {Tweet} from '../models/tweet.model.js'
const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const videoLike = await Like.findOne({
        video: videoId,
        likedBy: req.author._id
    })

    if (videoLike) {
       await videoLike.deleteOne();
       return res.status(200).json(new ApiResponse(200, {}, "like undo on video"))
    }
    else{
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.author._id
        })
        return res.status(200).json(new ApiResponse(200, newLike, "added like on video"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const commentLike = await Like.findOne({
        comment : commentId,
        likedBy: req.author._id
    })

    if (commentLike) {
       await commentLike.deleteOne();
       return res.status(200).json(new ApiResponse(200, {}, "like undo on video"))
    }
    else{
        const newLike = await Like.create({
            coment : commentLike,
            likedBy: req.author._id
        })
        return res.status(200).json(new ApiResponse(200, newLike, "added like on video"))
    }
})


const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const tweetLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.author._id
    })

    if (tweetLike) {
       await tweetLike.deleteOne();
       return res.status(200).json(new ApiResponse(200, {}, "like undo on tweet"))
    }
    else{
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.author._id
        })
        return res.status(200).json(new ApiResponse(200, newLike, "added like on tweet"))
    }
    
})

const getLikedVideos = asyncHandler(async (req, res) => {
const likedVideosByUser = await Like.aggregate([
    {
        $match: {
            likedBy: new mongoose.Types.ObjectId(req.author._id)
        }
    },
    {
        $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "video",
            pipeline: [
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            { $project: { fullName: 1, username: 1, avatar: 1 } }
                        ]
                    }
                },
                { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        title: 1,
                        views: 1,
                        thumbnail: 1,
                        owner: 1
                    }
                }
            ]
        }
    },
    { $unwind: "$video" }, // flatten video array
    { $replaceRoot: { newRoot: "$video" } } // make video the top-level object
])


return res
  .status(200)
  .json(new ApiResponse(200, likedVideosByUser, "Liked videos by user fetched successfully"))

})


export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}