import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid video id");
    }

    const channelData = await Subscription.findOne({ subscriber: req.user._id, channel: channelId }).lean()

    let data = null;

    try {
        if (channelData) {
            data = await Subscription.findByIdAndDelete({ _id: channelId, subscriber: req.user._id })
        } else {
            data = await Subscription.create({
                subscriber: req.user._id,
                channel: channelId
            })
        }

        return res
            .status(201)
            .json(new ApiResponse(201, data, `${channelData ? "Un-subscribed" : "Subscribed"} successfully`));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Subscription not updated!!"
        );
    }
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    try {
        const subscriptions = await Subscription.aggregate([
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
                    as: "subscriber"
                }
            },
            {
                $unwind: "$subscriber"
            },
            {
                $project: {
                    _id: 1,
                    channel: 1,
                    "subscriber._id": 1,
                    "subscriber.fullName": 1,
                    "subscriber.avatar": 1,
                }
            }
        ])

        return res
            .status(200)
            .json(new ApiResponse(200, subscriptions, "Subscription fetched successfully"));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Subscription not fetched!!"
        );
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const subscribedChannels = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(req.user?.id)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "channels"
                }
            },
            {
                $unwind: "$channels"
            },
            {
                $project: {
                    _id: 1,
                    channel_id: "$channel",
                    "channels.fullName": 1,
                    "channels.avatar": 1,
                }
            }
        ])

        return res
            .status(200)
            .json(new ApiResponse(200, subscribedChannels, "Subscription fetched successfully"));
    } catch (error) {
        throw new ApiError(
            500,
            error?.message || "Something went wrong. Subscription not fetched!!"
        );
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}