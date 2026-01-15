import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

/**
 * Dashboard Controller - Provides channel analytics and video management
 * 
 * This controller provides dashboard functionality including:
 * - Channel statistics (views, subscribers, videos, likes)
 * - Channel video listings
 */

/**
 * getChannelStats - Get comprehensive statistics for a channel
 * 
 * Features:
 * - Total video views (sum of all video views)
 * - Total subscribers count
 * - Total videos count (published and unpublished)
 * - Total likes on all videos
 * - Uses MongoDB aggregation for efficient calculation
 * 
 * Process:
 * 1. Get channel ID from authenticated user
 * 2. Aggregate total views from all videos
 * 3. Count total subscribers
 * 4. Count total videos
 * 5. Count total likes on videos
 * 6. Return comprehensive stats
 * 
 * Returns:
 * - totalViews: Sum of all video views
 * - totalSubscribers: Count of subscribers
 * - totalVideos: Count of all videos
 * - totalLikes: Count of likes on videos
 */
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id

    // Aggregate total views from all videos
    const totalViewsResult = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ])

    // Count total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })

    // Count total videos (published and unpublished)
    const totalVideos = await Video.countDocuments({
        owner: channelId
    })

    // Get all video IDs for this channel
    const channelVideos = await Video.find({
        owner: channelId
    }).select("_id")

    const videoIds = channelVideos.map(video => video._id)

    // Count total likes on all videos
    const totalLikes = await Like.countDocuments({
        video: { $in: videoIds }
    })

    // Build stats object
    const stats = {
        totalViews: totalViewsResult[0]?.totalViews || 0,
        totalSubscribers,
        totalVideos,
        totalLikes
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                stats,
                "Channel stats fetched successfully"
            )
        )
})

/**
 * getChannelVideos - Get all videos uploaded by the channel
 * 
 * Features:
 * - Returns all videos (published and unpublished)
 * - Includes video details
 * - Sorted by newest first
 * - Only returns videos owned by the authenticated user
 * 
 * Process:
 * 1. Get channel ID from authenticated user
 * 2. Find all videos owned by channel
 * 3. Populate owner information
 * 4. Sort by creation date (newest first)
 * 5. Return videos list
 */
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id

    // Find all videos owned by the channel
    const videos = await Video.find({
        owner: channelId
    })
    .populate("owner", "username fullName avatar")
    .sort({ createdAt: -1 }) // Newest videos first

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Channel videos fetched successfully"
            )
        )
})

export {
    getChannelStats, 
    getChannelVideos
    }