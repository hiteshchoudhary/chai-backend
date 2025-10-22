import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos etc.

    /* 
    1. Looking to the User, look out to:
        a. videos
        b. subscriptions
        c. views
    */

    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videosDetails"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscriptionsDetails"
            }
        },
        // join likes by matching video IDs
        {
            $lookup: {
                from: "likes",
                let: { userVideos: "$videosDetails._id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ["$video", "$$userVideos"] }
                        }
                    }
                ],
                as: "likesDetails"
            }
        },
        {
            $addFields: {
                totalViews: { 
                    $sum: { 
                        $map: { 
                            input: "$videosDetails", 
                            as: "video", 
                            in: {
                                $cond: {
                                    if: { $isArray: "$$video.views" },
                                    then: { $size: "$$video.views" },
                                    else: { $ifNull: ["$$video.views", 0] }
                                }
                            }
                        } 
                    } 
                },
                totalLikes: { $size: "$likesDetails" }, // count likes
                totalSubscribers: { $size: "$subscriptionsDetails" } // count subscribers
            }
        }, 
        {
            $project: {
                username: 1,
                totalLikes: 1,
                totalSubscribers: 1,
                totalViews: 1,
                "videosDetails._id": 1,
                "videosDetails.isPublished": 1,
                "videosDetails.thumbnail": 1,
                "videosDetails.title": 1,
                "videosDetails.description": 1,
                "videosDetails.createdAt": 1
            }
        }

    ]);


    if (!user) {
        throw new ApiError(400, "Error Fetching Stats")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Fetching Channel Stats Successful")
        )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const videos = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(req.user._id) }
        },
        {
            $addFields: {
                views: {
                    $cond: {
                        if: { $isArray: "$views" },
                        then: { $size: "$views" },
                        else: { $ifNull: ["$views", 0] }
                    }
                }
            }
        }
    ]);

    if (!videos) {
        throw new ApiError(400, "Fetching Channel Videos Failed")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Fetching Channel Videos Successful")
        )

})

export {
    getChannelStats,
    getChannelVideos
}