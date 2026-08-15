import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(401, "Unauthorized access")
    }

    const totalSubscribers = await Subscription.countDocuments({
        channel: userId
    })

    const videoStats = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" },
                totalLikes: { $sum: { $size: "$likes" } }
            }
        }
    ])

    const stats = videoStats[0] || {
        totalVideos: 0,
        totalViews: 0,
        totalLikes: 0
    }

    const channelStats = {
        totalSubscribers,
        totalVideos: stats.totalVideos,
        totalViews: stats.totalViews,
        totalLikes: stats.totalLikes
    }

    return res
            .status(200)
            .json(new ApiResponse(200, channelStats, "Generated channel stats"))
    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const userId = req.user?._id

    if (!userId) {
        throw new ApiError(401, "Unauthorized access")
    }

    const videos = await Video.find({owner: userId}).sort({ createdAt: -1 })

    return res
            .status(200)
            .json(new ApiResponse(200, videos, "Fetched videos of channel"))
})

export {
    getChannelStats, 
    getChannelVideos
    }