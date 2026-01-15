import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

/**
 * Subscription Controller - Handles channel subscription operations
 * 
 * This controller manages user subscriptions to channels including:
 * - Toggling subscriptions (subscribe/unsubscribe)
 * - Getting subscriber list of a channel
 * - Getting channels a user has subscribed to
 */

/**
 * toggleSubscription - Subscribe or unsubscribe from a channel
 * 
 * Features:
 * - If already subscribed, unsubscribes
 * - If not subscribed, subscribes
 * - Prevents self-subscription
 * - Validates channel exists
 * 
 * Process:
 * 1. Validate channelId
 * 2. Check if channel exists
 * 3. Prevent self-subscription
 * 4. Check if subscription already exists
 * 5. If exists, delete (unsubscribe)
 * 6. If not exists, create (subscribe)
 * 7. Return appropriate response
 */
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // Prevent self-subscription
    if (channelId === req.user._id.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    // Check if channel exists
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (existingSubscription) {
        // Unsubscribe: Remove subscription
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isSubscribed: false },
                    "Unsubscribed from channel successfully"
                )
            )
    } else {
        // Subscribe: Create new subscription
        const subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId
        })

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { isSubscribed: true, subscription },
                    "Subscribed to channel successfully"
                )
            )
    }
})

/**
 * getUserChannelSubscribers - Get list of subscribers for a channel
 * 
 * Features:
 * - Returns all users who subscribed to the channel
 * - Includes subscriber details (username, fullName, avatar)
 * - Uses aggregation for efficient querying
 * 
 * Process:
 * 1. Validate channelId
 * 2. Check if channel exists
 * 3. Aggregate subscriptions to get subscriber details
 * 4. Return subscriber list
 */
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    // Validate channelId
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // Check if channel exists
    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    // Aggregate to get subscribers with their details
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
                as: "subscriber",
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
                subscriber: {
                    $first: "$subscriber"
                }
            }
        },
        {
            $project: {
                subscriber: 1,
                subscribedAt: "$createdAt"
            }
        },
        {
            $sort: { subscribedAt: -1 } // Most recent subscriptions first
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "Subscribers fetched successfully"
            )
        )
})

/**
 * getSubscribedChannels - Get list of channels a user has subscribed to
 * 
 * Features:
 * - Returns all channels the user has subscribed to
 * - Includes channel details (username, fullName, avatar)
 * - Uses aggregation for efficient querying
 * 
 * Process:
 * 1. Validate subscriberId (or use current user)
 * 2. Aggregate subscriptions to get channel details
 * 3. Return subscribed channels list
 */
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    // Use subscriberId from params or default to current user
    const userId = subscriberId && isValidObjectId(subscriberId) 
        ? subscriberId 
        : req.user._id.toString()

    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    // Aggregate to get subscribed channels with their details
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: {
                    $first: "$channel"
                }
            }
        },
        {
            $project: {
                channel: 1,
                subscribedAt: "$createdAt"
            }
        },
        {
            $sort: { subscribedAt: -1 } // Most recent subscriptions first
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "Subscribed channels fetched successfully"
            )
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}