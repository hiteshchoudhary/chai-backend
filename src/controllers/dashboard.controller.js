import mongoose, { get } from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user?._id; //changed: we can simply get the userId by the verifyJWT middleware(that way we can't veiw other people's stats)

    const getTotalViews = await Video.aggregate([
        {
            $match:{ owner: new mongoose.Types.ObjectId(channelId) }
        },
        {
           $group: {
                _id: null,
                totalViews: { $sum: "$views"}
           }

        }
    ]);
    const totalViews = getTotalViews.length >0 ? getTotalViews[0].totalViews :0;
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId})
 

    const totalVideos = await Video.countDocuments({ owner: channelId });

    const getAllLikes = await Like.aggregate([
        {
            $lookup:{
                from:"videos",
                localField: "video",
                foreignField: "_id",
                as: "videoInfo"
            }
        },
        {
            $unwind: "$videoInfo"
        },
        {
            $match: {
                "videoInfo.owner":new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count:"totalLikes"
        }
    ])

    const totalLikes = getAllLikes.length >0 ? getAllLikes[0].totalLikes : 0;

    const stats = {
        totalViews,
        totalSubscribers,
        totalVideos,
        totalLikes
    }

    return res
    .status(200)
    .json(new ApiResponse(200, stats, "Channel stats fetched succesfully"))
  
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
})

const getChannelVideos = asyncHandler(async (req, res) => {

    const channelId = req.user?._id;
    const {page = 1, limit = 10} = req.query

    const getAllVideos=  Video.aggregate([
        {
            $match:{
                "owner":new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerInfo"
            }
        },
        {
            $unwind: "$ownerInfo"
        },
        {
            $sort:{ createdAt: -1 }
        }
    ])

    //Applying pagination
   

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
    }
    const result = await Video.aggregatePaginate(getAllVideos,options);

    return res
    .status(200)
    .json(new ApiResponse(200, result, "Channel videos fetched successfully"))
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }