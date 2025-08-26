import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.models.js"
import { Subscription } from "../models/subscription.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const {channelId} = req.params

    if(!channelId){
        throw new ApiError(400, "ChannelId is required field")
    }

    const alreadySubscribed = await Subscription.findById(channelId);
    if(alreadySubscribed){
        await Subscription.findByIdAndDelete(channelId);
        return res
        .status(200)
        .json(ApiResponse(200, "Subscription toggled successfully"))
    }

    const toggleSubscription = await Subscription.create({
        subscriber : req.user._id,
        cahnnel : channelId
    })

    
    if (!toggleSubscription) {
        throw new ApiError(500, "Error while toggle subscription...");
    }

    return res
        .status(201)
        .json(
        201,
        "Subscription status toggled successfully...",
        toggleSubscription
        );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(channelId) || !channelId) {
        throw new ApiError(400, "Invalid channel id...");
    }

    const subscribers = await Subscription.aggregate([
        {
        $match: {
            channel: new mongoose.Types.ObjectId(channelId),
        },
        },
        {
        $count: "subscriberCount",
        },
    ]);

    return res
        .status(200)
        .json(
        new ApiResponse(200, "Subscribers fetched successfully...", subscribers)
        );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!subscriberId || !mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id...");
    }

    const subscribed = await Subscription.aggregate([
        {
        $match: {
            subscriber: new mongoose.Types.ObjectId(subscriberId),
        },
        },
        {
        $count: "subscribed ",
        },
    ]);

    return res
        .status(200)
        .json(
        new ApiResponse(
            200,
            "Subscriber to channels fetched successfully...",
            subscribed
        )
        );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}