import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const subscriberId = req.user?._id;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (subscriberId.toString() === channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const existingSub = await Subscription.findOne({
        channel: channelId,
        subscriber: subscriberId,
    });

    if (existingSub) {
        await existingSub.deleteOne();
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "Unsubscribed successfully")
            );
    }

    const newSubscription = await Subscription.create({
        channel: channelId,
        subscriber: subscriberId,
    });

    return res
            .status(200)
            .json(
                new ApiResponse(200, newSubscription, "Subscribed successfully")
            );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            fullname: 1,
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                $first: "$subscribers"
            }
        }
    ])

    return res
            .status(200)
            .json(
                new ApiResponse(200, subscribers, "Subscribers fetched successfully")
            );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "chanel",
                foreignField: "_id",
                as: "subscribedTo",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            fullname: 1,
                            username: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                $first: "$subscribedTo"
            }
        }
    ])

    return res
            .status(200)
            .json(
                new ApiResponse(200, subscribedTo, "Subscribed channels fetched successfully")
            );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}