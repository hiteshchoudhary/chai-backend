import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId, userId } = req.params;

    // Validate ObjectIds
    if (!isValidObjectId(channelId) || !isValidObjectId(userId)) {
        return res.status(400).json({
            message: "Invalid channelId or userId",
        });
    }

    // Check if the subscription exists
    const subscription = await Subscription.findOne({
        channel: channelId,
        subscriber: userId,
    });

    if (subscription) {
        // If subscription exists, remove it
        await Subscription.deleteOne({ _id: subscription._id });
        return res.status(200).json({
            message: "Subscription removed successfully",
        });
    } else {
        // If subscription does not exist, create it
        await Subscription.create({
            subscriber: userId,
            channel: channelId,
        });
        return res.status(201).json({
            message: "Subscription added successfully",
        });
    }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscribers = await Subscription.find({
        channel: channelId
    })
    res.json({
        message: "the subscribers are ",
        subscribers: subscribers
    })
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const channels= await Subscription.find({
        subscriber: subscriberId
    })
    res.json({
        message: "channels subscribed are",
        channels: channels
    })
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}