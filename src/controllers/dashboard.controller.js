import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const totalVideos=await Video.countDocuments({owner:req.user._id});
    const channelData=await Video.aggregate([
        {
            $match:{
                owner:req.user._id
            }
        },
        {
            $group:{
                _id:null,
                totalVideos:{$sum:1},
                totalVideoViews:{$sum:"$views"}
            }
        },
    {
        $project:{
            _id:0,
        }
    }
    ]);
    const channelSubsribers=await Subscription.aggregate([
        {
            $match:{
                channel:req.user._id
            }
        },
        {
            $group:{
                _id:null,
                totalSubscribers:{$sum:1}
            }
        },
    {
        $project:{
            _id:0,
        }
    }
    ])
    const userVideos=await Video.find({owner:req.user._id}).select("_id");
    const channelLikes=await Like.aggregate([
        {
            $match:{
                likedItemModel:'Video',
                likedItem:{$in:userVideos.map(video=>video._id)}
            }
        },
        {
        $group:{
            _id:null,
            totalChannelLikes:{$sum:1}
        }
    },
    {
        $project:{
            _id:0,
        }
    }
    ])
    res.status(200).json(new ApiResponse(200,{
        totalchannelVideos:channelData.length>0?channelData[0]?.totalVideos:0,
        channelVideoViews:channelData.length>0?channelData[0]?.totalVideoViews:0,
        channelLikes:channelLikes.length>0?channelLikes[0]?.totalChannelLikes:0,
        channelSubsribers:channelSubsribers.length!=0?channelSubsribers[0].totalSubscribers:0
    },
    "channel data retrieved successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const channelVideos= await Video.aggregate([
        {
            $match:{
                owner:req.user._id
            }
        }
    ])
    res.status(200).json(new ApiResponse(200,channelVideos,"channel videos retrieved successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }