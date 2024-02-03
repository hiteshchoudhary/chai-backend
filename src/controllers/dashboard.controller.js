import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, // total subscribers, // total videos, total likes etc.
  let user = req.user;
  if (!user) {
    throw new ApiError(200, "User not found for Stats");
  };

  let subscriptionStats = await Subscription.aggregate([
    {
      $match: { username: user?.username },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subsCount",
      },
    },
    {
      $addFields: {
        subsCount: { $size: "$subsCount" },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subsCount: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  let videosStats = await Video.aggregate([
    {
      $match: { username: user?.username },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "totalVideosCount",
      },
    },
    {
      $addFields: {
        videoCount: { $size: "$totalVideosCount" },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        totalVideosCount: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscriptionStats, videosStats, likesStats },
        "All stats fetched successfully"
      )
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  let user = req.user;
  if (!user) {
    throw new ApiError(200, "User not found while getting videos");
  }

  const videos = await Video.aggregate([
    {
      $match: {
        username: user?.username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "userVideos",
      },
    },
    {
      $addFields: {
        videoCount: {
          $size: "$userVideos",
        },
        videos: "$userVideos",
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        userVideos: 1,
        videoCount: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "All videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
