import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {

    // TODO: Get the channel stats like total video views,
    //  total subscribers, total videos, total likes etc.
    try {
        const userId = req.params.userId;

        // Calculate total number of videos
        const totalVideos = await Video.countDocuments({ owner: userId });

        // Calculate total views on all videos
        const totalViewsPipeline = [
            {
                $match: {
                    owner: mongoose.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" },
                },
            },
        ];

        const totalViewsResult = await Video.aggregate(totalViewsPipeline);
        const totalViews = totalViewsResult.length > 0 ? totalViewsResult[0].totalViews : 0;

        // Calculate number of likes on the user's videos
        const totalLikesPipeline = [
            {
                $match: {
                    likedBy: mongoose.Types.ObjectId(userId),
                },
            },
            {
                $group: {
                    _id: null,
                    totalLikes: { $sum: 1 },
                },
            },
        ];

        const totalLikesResult = await Like.aggregate(totalLikesPipeline);
        const totalLikes = totalLikesResult.length > 0 ? totalLikesResult[0].totalLikes : 0;

        // Get total number of subscribers
        const totalSubscribers = await Subscription.countDocuments({ channel: userId });

        new ApiResponse(200, "Channel metadata retrieved:",{
            totalViews,
            totalVideos,
            totalLikes,
            totalSubscribers,
        });
        
    } catch (error) {
        console.error('Error getting user metrics:', error);
        new ApiError(500, "Internal Server Error")
    }
});


const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        const { ownerId } = req.params;

        const pipeline = [
            // Match videos where the owner is the specified owner (creator)
            {
                $match: {
                    owner: mongoose.Types.ObjectId(ownerId),
                },
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    videoFile: 1,
                },
            },
        ];

        const userVideos = await Video.aggregate(pipeline);

        res.status(200).json(
            new ApiResponse(200, "User Videos retrieved:", userVideos)
        );
    } catch (error) {
        console.error('Error getting user videos:', error);
        res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }
});


export {
    getChannelStats,
    getChannelVideos
}