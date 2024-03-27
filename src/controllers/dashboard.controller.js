import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
// import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const totalViews = await Video.aggregate([
    {
      $match: {
        owner: req.user?._id,
        isPublished: true,
      },
    },
    {
      $group: { _id: null, totalViews: { $sum: "$views" } },
    },
    {
      $project: {
        _id: 1,
        totalViews: 1,
      },
    },
  ])

  if (!totalViews) {
    throw new ApiError(404, "Something went wrong in totalViews")
  }

  const totalsubscribers = await Subscription.aggregate([
    {
      $match: {
        channel: req.user?._id,
      },
    },
    {
      $group: {
        _id: null,
        totalSubs: { $sum: 1 },
      },
    },
    {
      $project: {
        totalSubs: 1,
      },
    },
  ])

  if (!totalsubscribers) {
    throw new ApiError(404, "Something went wrong in totalsubscribers")
  }
  const totalVideos = await Video.aggregate([
    {
      $match: {
        owner: req.user?._id,
        isPublished: true,
      },
    },
    {
      $group: {
        _id: null,
        totalVideo: { $sum: 1 },
      },
    },
    {
      $project: {
        totalVideo: 1,
      },
    },
  ])

  if (!totalVideos) {
    throw new ApiError(404, "Something went wrong in totalVideos")
  }
  const totalLikes = await Video.aggregate(
    [
      {
        $match: {
          owner: req.user?._id,
          isPublished: true
        }
      },
      {
        $lookup: {
          from: "Like",
          localField: "_id",
          foreignField: "video",
          as: "videoLikes"
        }
      },
      {
        $unwind: "$videoLikes"
      },
      {
        $group: {
          _id: null,
          likes: { $sum: 1 }
        }
      },
      {
        $project: {
          likes: 1
        }
      }
    ]
  )

  if (!totalLikes) {
    throw new ApiError(404, "Something went wrong in totalLikes")
  }
  const totalTweet = await Tweet.aggregate(
    [
      {
        $match: {
          owner: req.user?._id
        }
      },
      {
        $group: {
          _id: null,
          tweets: { $sum: 1 }
        }
      },
      {
        $project: {
          tweets: 1
        }
      }
    ]
  )

  if (!totalTweet) {
    throw new ApiError(404, "Something went wrong in totalTweet")
  }
  res.status(200).json(
    new ApiResponse(200, { totalLikes, totalVideos, totalsubscribers, totalTweet, totalViews }, "Successfully got the channel states")
  )


});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  try {
    const aggregate = [
      {
        $match: {
          owner: req.user?._id,
          isPublished: true,
        },
      },
    ];

    const videoList = await Video.aggregate(aggregate);

    if (!videoList || videoList.length === 0) {
      res.status(200).json(new ApiResponse(200, videoList, "No video founded"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, videoList, "Successfully got the videos"));
  } catch (error) {
    throw new ApiError(400, error, "Something wrong in getting channel video");
  }

});

export { getChannelStats, getChannelVideos };
