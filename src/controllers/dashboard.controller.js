import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const channelId = req.user._id;

  if (!channelId) {
    throw new ApiError(401, "Not a valid channel");
  }

  const totalVideos = await Video.countDocuments({ owner: channelId });

  const viewsAgg = await Video.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);
  const totalViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;

  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  const likesAgg = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoData",
      },
    },
    { $unwind: "$videoData" },
    { $match: { "videoData.owner": new mongoose.Types.ObjectId(channelId) } }
  ]);
    
    const totalLikes = likesAgg.length > 0 ? likesAgg.length : 0;

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          totalVideos,
          totalViews,
          totalSubscribers,
          totalLikes,
        },
        "Channel stats fetched successfully"
      )
    );
});


const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
  };
  const result = await Video.aggregatePaginate(
    [{ $match: { owner: new mongoose.Types.ObjectId(userId) } }],
    options
  );
  if (!result.docs[0]) throw new ApiError(404, "No Video Found");
  return res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", result));
});

export { getChannelStats, getChannelVideos };
