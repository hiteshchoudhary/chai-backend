import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"



// ==========================================
// GET CHANNEL STATS
// ==========================================
const getChannelStats = asyncHandler(async (req, res) => {

    const channelId = req.user?._id

    // total videos
    const totalVideos = await Video.countDocuments({
        owner: channelId
    })

    // total video views
    const totalViewsResult = await Video.aggregate([

        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },

        {
            $group: {
                _id: null,
                totalViews: {
                    $sum: "$views"
                }
            }
        }

    ])

    const totalViews =
        totalViewsResult[0]?.totalViews || 0

    // total subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })

    // total likes on videos
    const totalLikesResult = await Video.aggregate([

        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },

        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },

        {
            $group: {
                _id: null,
                totalLikes: {
                    $sum: "$likesCount"
                }
            }
        }

    ])

    const totalLikes =
        totalLikesResult[0]?.totalLikes || 0

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews,
                totalSubscribers,
                totalLikes
            },
            "Channel stats fetched successfully"
        )
    )

})



// ==========================================
// GET CHANNEL VIDEOS
// ==========================================
const getChannelVideos = asyncHandler(async (req, res) => {

    const channelVideos = await Video.aggregate([

        {
            $match: {
                owner: new mongoose.Types.ObjectId(
                    req.user?._id
                )
            }
        },

        // likes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },

        {
            $addFields: {

                likesCount: {
                    $size: "$likes"
                }

            }
        },

        // owner
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",

                pipeline: [

                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },

                    {
                        $addFields: {

                            subscribersCount: {
                                $size: "$subscribers"
                            },

                            isSubscribed: {
                                $cond: {
                                    if: {
                                        $in: [
                                            req.user?._id,
                                            "$subscribers.subscriber"
                                        ]
                                    },
                                    then: true,
                                    else: false
                                }
                            }

                        }
                    },

                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }

                ]
            }
        },

        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },

        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                isPublished: 1,
                likesCount: 1,
                owner: 1
            }
        },

        {
            $sort: {
                createdAt: -1
            }
        }

    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channelVideos,
            "Channel videos fetched successfully"
        )
    )

})



export {
    getChannelStats,
    getChannelVideos
}
