import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  try {
  } catch (error) {}
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  try {
    const user = req.user._id;
    const channelVideos = await Video.findById({ owner: user });
    if (!channelVideos) {
      return new ApiError(404, "videos not found");
    }
    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          channelVideos,
          "Fetched Channel Videos Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, "Something went wrong");
  }
});

export { getChannelStats, getChannelVideos };
