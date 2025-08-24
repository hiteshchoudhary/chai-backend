import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const existingSub = await Subscription.findOne({
        channel:channelId,
        subscriber: req.author._id
    })

    if(existingSub) {
    await existingSub.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    } else {
        // If not exists -> subscribe (create it)
        const sub = await Subscription.create({
            channel: channelId,
            subscriber: req.author._id,
        });
        return res
            .status(200)
            .json(new ApiResponse(200, sub, "Subscribed successfully"));
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "channelSubs",
            }
        },
        {
            $addFields: {
                subscriberList: {
                    $size: "$channelSubs"
                }
            }
        },
        {
            $project: {
                fullName:1,
                email:1,
                avatar:1,
                subscriberList:1,
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, user[0], "fetched subscibers of a channel"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedChannels"
            }
        },
        {
            $addFields: {
                subscribedChannelsList: {
                    $size: "$subscribedChannels"
                }
            }
        },
         {
            $project: {
                fullName:1,
                email:1,
                avatar:1,
                subscribedChannelsList:1,
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200, user[0], "subscribedCahnnels list fetched success"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}