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

    const channelData = await Subscription.findOneAndDelete({ channel: channelId }).lean()

    let data = null;

    try {
        if (channelData) {
            data = await Subscription.findByIdAndDelete({ _id: channelId })
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
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}