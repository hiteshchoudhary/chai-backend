import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const totalVideoViews = await Video.aggregate([
    {
      $match: {
        owner: req.user._id,
      },
    },
    {
      $group: {
        _id: null,
        totalVideoViews: { $sum: "$views" },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  const totalSubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: req.user._id,
      },
    },
    {
      $count: "totalSubscribers",
    },
  ]);

  const totalVideos = await Video.aggregate([
    {
      $match: {
        owner: req.user._id,
      },
    },
    {
      $count: "totalVideos",
    },
  ]);

  const totalVideoLikes = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videos",
      },
    },
    {
      $match: {
        "videos.owner": req.user._id,
      },
    },
    {
      $count: "totalVideoLikes",
    },
  ]);

  const totalCommentLikes = await Like.aggregate([
    {
      $lookup: {
        from: "comments",
        localField: "comment",
        foreignField: "_id",
        as: "comments",
      },
    },
    {
      $match: {
        "comments.owner": req.user._id,
      },
    },
    {
      $count: "totalCommentLikes",
    },
  ]);

  const totalTweetLikes = await Like.aggregate([
    {
      $lookup: {
        from: "tweets",
        localField: "tweet",
        foreignField: "_id",
        as: "tweets",
      },
    },
    {
      $match: {
        "tweets.owner": req.user._id,
      },
    },
    {
      $count: "totalTweetLikes",
    },
  ]);

  const channelStats = {
    totalVideoViews: totalVideoViews?.[0]?.totalVideoViews ?? 0,
    totalSubscribers: totalSubscribers?.[0]?.totalSubscribers ?? 0,
    totalVideos: totalVideos?.[0]?.totalVideos ?? 0,
    totalLikes:
      (totalVideoLikes?.[0]?.totalVideoLikes ?? 0) +
      (totalCommentLikes?.[0]?.totalCommentLikes ?? 0) +
      (totalTweetLikes?.[0]?.totalTweetLikes ?? 0),
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelStats, "Channel stats fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const channelVideos = await Video.find({
    owner: req.user._id,
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelVideos, "Channel videos fetched successfully")
    );
});

export { getChannelStats, getChannelVideos };

