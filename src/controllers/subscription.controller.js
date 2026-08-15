import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if (!(isValidObjectId(channelId))) {
        throw new ApiError(400, "Invalid object id")
    }

    const subscriber = req.user._id
    const channel = channelId
    const subscribed = await Subscription.findOne({
        $and: [{subscriber: subscriber}, {channel: channel}]
    })

    if (subscribed) {
        await Subscription.findOneAndDelete({subscriber, channel})
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed successfully."))
    } 
    else {
        const subscription = await Subscription.create({subscriber, channel})
        return res
            .status(200)
            .json(new ApiResponse(200, subscription, "Subscribed successfully."))
    }
}
)

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params

    if (!(isValidObjectId(subscriberId))) {
        throw new ApiError(400, "Invalid channel")
    }

    const subscribers = await Subscription.find({channel:subscriberId}).populate("subscriber", "username fullName avatar")

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Channel subscribers fetched successfully."))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const subscriberId = channelId

    if (!(isValidObjectId(subscriberId))) {
        throw new ApiError(400, "Invalid Subscriber ID")
    }

    const subscriptions = await Subscription.find({subscriber: subscriberId}).populate("channel", "username fullName avatar")

    return res
        .status(200)
        .json(new ApiResponse(200, subscriptions, "Subscriptions fetched successfully."))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}