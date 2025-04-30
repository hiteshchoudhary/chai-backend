import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelID,creatorId} = req.body
    if(!channelID || !creatorId){
        res.status(400).json({
            message: "incorrect inputs"
        })
    }
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelID
    })
    const totalVideos = await Video.countDocuments({
        owner: creatorId
    })
    const videos = await Video.find({
        owner: creatorId
    })
    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
    const videoIds = videos.map((video)=> video._id)
    const totalLikes = await Like.countDocuments({
        video: {$in: videoIds}
    })

    
    res.status(200).json({
        message: "channel stats are",
        totalSubscribers,
        totalVideos,
        totalViews,
        totalLikes
    });
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {creatorId} = req.body
    if( !creatorId){
        res.status(400).json({
            message: "incorrect inputs"
        })
    }
    const totalVideos = await Video.find({
        owner: creatorId
    })
    res.status(200).json({
        message: "all the videos of the channel",
        videos: totalVideos
    })
})

export {
    getChannelStats, 
    getChannelVideos
    }