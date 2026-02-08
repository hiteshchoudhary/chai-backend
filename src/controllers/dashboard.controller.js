import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const totalVideos = await Video.countDocuments({
    owner: channelId,
  });
  const viewsData = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
      },
    },
  ]);

  const totalViews = viewsData.length > 0 ? viewsData[0].totalViews : 0;

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const channelVideos = await Video.find({ owner: channelId }).select("_id");

  const videoIds = channelVideos.map((video) => video._id);

  const totalLikes = await Like.countDocuments({
    video: { $in: videoIds },
  });

  return res.status(200).json(
    new ApiResponse(200, "Channel stats fetched successfully", {
      totalVideos,
      totalViews,
      totalSubscribers,
      totalLikes,
    })
  );
});


const getChannelVideos = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  const videos = await Video.find({ owner: channelId })
    .sort({ createdAt: -1 })
    .select("title thumbnail views createdAt isPublished");

  if (!videos) {
    throw new ApiError(404, "No videos found for this channel");
  }

  return res.status(200).json(
    new ApiResponse(200, "Channel videos fetched successfully", videos)
  );
});

export { getChannelStats, getChannelVideos };
