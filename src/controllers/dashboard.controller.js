import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelID } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelID)) {
    throw new ApiError(400, "invalid channel ID");
  }

  const totalSubscribers = await Subscription.countDocuments({ channelID });

  const videos = await Video.find({ channelID });

  const totalVideos = videos.length;

  const totalViews = videos.reduce((acc, video) => acc + video.views, 0);

  const totalLikes = await Like.countDocuments({
    videoID: { $in: videos.map((video) => video._id) },
  });

  res.status(200).json(
    new ApiResponse(
      true,
      {
        totalSubscribers,
        totalLikes,
        totalVideos,
        totalViews,
      },
      "channel stats retrieved successfully!"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const { channelID } = req.params;

  if (!mongoose.Types.ObjectId.isValid(channelID)) {
    throw new ApiError(400, "Invalid Channel ID");
  }

  const videos = await Video.findOne({ channelID });

  if (videos.length === 0) {
    throw new ApiError(404, "No videos found on this channel");
  }
  res
    .status(200)
    .json(new ApiResponse(true, videos, "Videos retrieved successfully"));
});

export { getChannelStats, getChannelVideos };
