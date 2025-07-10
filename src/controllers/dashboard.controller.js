import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user._id
    if(!userId?.trim()){
        throw new ApiError(400, "userId is required")
    }
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    // total videos
    const totalVideos = await Video.countDocuments({
        owner:userId
    })

    if(!totalVideos){
        throw new ApiError(500, "Failed to get total videos")
    }

    // total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel:userId
    })
    if(!totalSubscribers){
        throw new ApiError(500, "Failed to get total subscribers")
    }

    // total likes
    const totalLikes = await Like.countDocuments({
        likedBy:userId
    })

    if(!totalLikes){
        throw new ApiError(500, "Failed to get total likes")
    }
    
    // total views
    const totalViews = await Video.aggregate([
        {
            $match:{
                owner:userId
            }
        },
        {
            $group:{
                _id:null,
                totalViews:{
                    $sum:"$views"
                }
            }
        }
    ])
    if(!totalViews){
        throw new ApiError(500, "Failed to get total views")
    }

    // total comments
    const totalComments = await Video.aggregate([
        {
            $match:{
                owner:userId
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments"
            }
        },
        {
            $unwind:{path:"$comments", preserveNullAndEmptyArrays:true}
        },
        {
            $match:{
                $comments:{
                    $ne:null
                }
            }
        },
        {
            $group:{
                _id:null,
                totalComments:{
                    $sum:1
                }
            }
        }
    ])
    
    if(!totalComments){
        throw new ApiError(500, "Failed to get total comments")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, 
    {
        totalVideos:totalVideos,
        totalSubscribers:totalSubscribers,
        totalLikes:totalLikes,
        totalViews:totalViews[0].totalViews,
        totalComments:totalComments[0].totalComments
    }, "Channel stats fetched successfully"))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    
    const userId = req.user._id
    if(!userId?.trim()){
        throw new ApiError(400, "userId is required")
    }
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const videos = await Video.find({
        owner:userId
    }).populate("owner", "fullName username avatar email")

    if(!videos || videos.length === 0){
        throw new ApiError(404, "No videos found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"))


})

export {
    getChannelStats, 
    getChannelVideos
    }