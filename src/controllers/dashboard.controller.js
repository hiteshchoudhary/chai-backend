import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    try{
        const userId = req.user.id;

        //total videos
        const totalVideos = await Video.countDocuments({owner: userId});

        //total views
        const totalViewsAgg = await Video.aggregate([
            {
                $match: {owner:userId}
            },
            {
                $group: {
                    _id: null,
                    totalViews: {$sum: "$views"}
                }
            }
        ]);

        const totalViews = totalViewsAgg.length ? totalViewsAgg[0].totalViews : 0;

        //total likes
        const totalLikes = await Like.countDocuments({owner: userId});

        //total subscribers
        const totalSubscribers = await Subscription.countDocuments({channel: userId});

        const stats = {
            totalVideos,
            totalViews,
            totalLikes,
            totalSubscribers
        }

        next(new ApiResponse(200, stats))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    try{
        const userId = req.user.id;
        
        // use pagination for better performance - doesn't load all videos at once
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const videos = await Video.find({owner: userId}).sort({createdAt: -1}).skip(skip).limit(limit);
        const totalVideos = await Video.countDocuments({owner: userId});

        next(new ApiResponse(200, {
            totalVideos, 
            currentPage: page,
            totalPages: Math.ceil(totalVideos / limit),
            videos
        }))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

export {
    getChannelStats, 
    getChannelVideos
}