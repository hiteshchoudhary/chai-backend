import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {User} from '../models/user.model.js'

const getChannelStats = asyncHandler(async (req, res) => {
  const userStats = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.author._id), // use correct field
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "video",
              as: "comments",
            },
          },
          {
            $addFields: {
              likesCount: { $size: "$likes" },
              commentsCount: { $size: "$comments" },
              viewsCount: { $ifNull: ["$views", 0] }, // safer for number field
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedChannels",
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "_id",
        foreignField: "owner",
        as: "tweets",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "tweet",
              as: "tweetLikes",
            },
          },
          {
            $addFields: {
              tweetLikesCount: { $size: "$tweetLikes" },
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "playlists",
        localField: "_id",
        foreignField: "owner",
        as: "playlists",
      },
    },
    {
      $addFields: {
        totalVideos: { $size: "$videos" },
        totalSubscribers: { $size: "$subscribers" },
        totalSubscribedChannels: { $size: "$subscribedChannels" },
        totalPlaylists: { $size: "$playlists" },
        totalLikesOnVideos: { $sum: "$videos.likesCount" },
        totalCommentsOnVideos: { $sum: "$videos.commentsCount" },
        totalViewsOnVideos: { $sum: "$videos.viewsCount" },
        totalTweets: { $size: "$tweets" },
        totalTweetLikes: { $sum: "$tweets.tweetLikesCount" },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        avatar: 1,
        totalVideos: 1,
        totalSubscribers: 1,
        totalSubscribedChannels: 1,
        totalPlaylists: 1,
        totalLikesOnVideos: 1,
        totalCommentsOnVideos: 1,
        totalViewsOnVideos: 1,
        totalTweets: 1,
        totalTweetLikes: 1,
        purchasedMovies: 1, // will only work if schema has this field
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, userStats, "Channel stats fetched successfully")
  );
});

const adminDashboard = asyncHandler(async (req,res) => {
  const admin = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.author._id),
      },
    },
    {
      $lookup: {
        from: "movies",
        localField: "_id",
        foreignField: "owner",
        as: "movieStats",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "movie",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "movie",
              as: "comments",
            },
          },
          {
            $addFields: {
              likesCount: { $size: "$likes" },
              commentsCount: { $size: "$comments" },
              // check if views is number or array:
              viewsCount: { $ifNull: ["$views", 0] },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalLikesOnMovies: { $sum: "$movieStats.likesCount" },
        totalCommentsOnMovies: { $sum: "$movieStats.commentsCount" },
        totalViewsOnMovies: { $sum: "$movieStats.viewsCount" },
        totalNoOfMovies: { $size: "$movieStats" },
      },
    },
    {
      $project: {
        fullName:1,
        username:1,
        totalNoOfMovies:1,
        totalLikesOnMovies:1,
        totalCommentsOnMovies:1,
        totalViewsOnMovies:1,

      }
    }
  ]);

  return res.status(200).json(new ApiResponse(200, admin, "admin success"))
});

export {
    getChannelStats, 
    adminDashboard,
}