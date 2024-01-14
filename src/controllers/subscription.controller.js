import mongoose, { isValidObjectId } from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // /c/65a17b842615d1ca34ba31dc
    const { channelId } = req.params
    if (!channelId) {
        throw new ApiError(400, "Invalid/Something messied")
    }

    const subscribed = await Subscription.create({
        subscriber: req.user,
        // channel : new mongoose.Types.ObjectId(channelId)
        channel: channelId
    })

    if (!subscribed) {
        throw new ApiError(500, "subscribed failed")
    }

    res
        .status(200)
        .json(new ApiResponse(200, subscribed, "you are subscribed to this channel"))

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!channelId) {
        throw new ApiError(400, "Invalid/Something messied")
    }

    const userSubscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: channelId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "channels",
                pipeline: [
                    
                    {
                        $project: {
                            userName: 1,
                            email : 1,
                            avatar: 1,
                        }
                    }
                ]
            },

            

        },
        {
            $addFields : {
                channelsDetails : {
                    $arrayElemAt: ["$ownerResult", 0],
                }
            }
        },
    ])


    if (!userSubscribedChannels) {
        throw new ApiError(500, "finding failed")
    }

    res
        .status(200)
        .json(new ApiResponse(200, userSubscribedChannels, "you are subscribed to this channel"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId) {
        throw new ApiError(400, "Invalid/Something messied")
    }
    const userSubscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels",
                pipeline: [
                    
                    {
                        $project: {
                            userName: 1,
                            email : 1,
                            avatar: 1,
                        }
                    }
                ]
            },

            

        },
        {
            $addFields : {
                channelsDetails : {
                    $arrayElemAt: ["$ownerResult", 0],
                }
            }
        },
    ])


    if (!userSubscribedChannels) {
        throw new ApiError(500, "finding failed")
    }

    res
        .status(200)
        .json(new ApiResponse(200, userSubscribedChannels, "you are subscribed to this channel"))
})

export {
    getSubscribedChannels, getUserChannelSubscribers, toggleSubscription
}
