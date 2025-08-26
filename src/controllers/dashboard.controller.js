import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscription} from "../models/subscription.models.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelDetails = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "allVideos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
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
        as: "subscriptions",
      },
    },
    {
      $addFields: {
        totalVideos: { $size: "$allVideos" },
        totalViews: {
          $sum: "$allVideos.views",
        },
        totalLikes: {
        $sum: {
            $map: {
            input: "$allVideos",
            as: "video",
            in: {
                $size: { $ifNull: ["$$video.likes", []] },
                },
                },
            },
        },
        totalSubscribers: { $size: "$subscriptions" },
      },
    },
    {
      $project: {
        allVideos: 0,
        subscriptions: 0,
        password: 0,
        email: 0,
        // Hide any other private fields
      },
    },
    ]);

    if (!channelDetails.length) {
        throw new ApiError(404, "Channel not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channelDetails[0], "Channel stats fetched")
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const videos = await Video.find({
        owner: req.user?._id,
    });

    if(!videos){
        throw new ApiError(400, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Channel videos fetched successfully", videos));
})

export {
    getChannelStats, 
    getChannelVideos
    }