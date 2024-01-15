import {Types, isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// toggle subscription by channel id
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    // check if Invalid channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    // check if channel not available
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not find!");
    }

    // prevent subscribe to own channel
    if (channelId.toString() === userId) {
        throw new ApiError(400, "You cannot subscribe your own channel!");
    }

    // toggle the subscription
    const subscription = await Subscription.findOne({ channel: channelId });

    let unSubscribe;
    let subscribe;

    if (subscription?.subscriber?.toString() === userId) {
        // un-subscribe
        unSubscribe = await Subscription.findOneAndDelete({
            subscriber: userId,
            channel: channelId
        })
    } else {
        // subscribe
        subscribe = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        `${unSubscribe ? "unSubscribe" : "Subscribe"} successfully`
    ))
})

// get subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // check if Invalid channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    // check if channel not available
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not find!");
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                channel: new Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberLists",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscriberLists: {
                    $first: "$subscriberLists"
                }
            }
        }
    ])

    return res.status(200).json(new ApiResponse(
        200,
        { subscriberLists: subscriptions[0]?.subscriberLists || [] },
        "Subscriber lists fetched successfully"
    ))
})

// get channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // check if Invalid subscriberId
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriberId");
    }

    // check if subscriber not available
    const subscriber = await User.findById(subscriberId);
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not find!");
    }

    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: new Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannelLists",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                subscribedChannelLists: {
                    $first: "$subscribedChannelLists"
                }
            }
        }
    ])

    return res.status(200).json(new ApiResponse(
        200,
        { subscribedChannelLists: subscriptions[0]?.subscribedChannelLists || [] }
    ))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}