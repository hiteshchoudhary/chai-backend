import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get channel stats
const getChannelStats = asyncHandler(async (req, res) => {
    const { channelID, creatorId } = req.body;

    // Validate inputs
    if (!mongoose.isValidObjectId(channelID) || !mongoose.isValidObjectId(creatorId)) {
        return res.status(400).json({
            message: "Invalid channelID or creatorId",
        });
    }

    // Fetch stats
    const totalSubscribers = await Subscription.countDocuments({ channel: channelID });
    const totalVideos = await Video.countDocuments({ owner: creatorId });
    const videos = await Video.find({ owner: creatorId });
    const totalViews = videos.reduce((sum, video) => sum + video.views, 0);
    const videoIds = videos.map((video) => video._id);
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    res.status(200).json({
        message: "Channel stats retrieved successfully",
        stats: {
            totalSubscribers,
            totalVideos,
            totalViews,
            totalLikes,
        },
    });
});

// Get all videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const { creatorId, page = 1, limit = 10 } = req.body;

    // Validate inputs
    if (!mongoose.isValidObjectId(creatorId)) {
        return res.status(400).json({
            message: "Invalid creatorId",
        });
    }

    // Fetch videos with pagination
    const videos = await Video.find({ owner: creatorId })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    const totalVideos = await Video.countDocuments({ owner: creatorId });

    res.status(200).json({
        message: "Videos retrieved successfully",
        videos,
        metadata: {
            totalVideos,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalVideos / limit),
        },
    });
});

export { getChannelStats, getChannelVideos };