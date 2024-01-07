import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {

    try {

        const { channelId } = req.params
        // TODO: toggle subscription

        const userId = req.user.id;

        // Check if the channel exists
        const channel = await User.findById(channelId);
        if (!channel) {
            throw new ApiError(404, "Channel not found")
        }

        const subscription = await Subscription.findOne({ subscriber: userId, channel: channelId });

        // user has subcribed to the channel => unsubscribe channel
        if (subscription) {
            await subscription.remove();
            return res.status(200).json(
                new ApiResponse(200, {}, "Unsubscribed successfully")
            );
        }
        // user has not subcribed to the channel => subscribe channel
        else {
            await Subscription.create({
                subscriber: userId,
                channel: channelId,
            });

            return res.status(201).json(
                new ApiResponse(200, {}, "Subscribed successfully")
            );
        }
    }
    catch (error) {
        console.error("Error toggling subscription:", error);
        return res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    try {
        const { channelId } = req.params

        // Populate the 'subscriber' field with the 'username' field from the User model
        const subscribers = await Subscription.find({ channel: channelId })
            .populate('subscriber', 'username');

        res.status(200).json(
            new ApiResponse(200, "Subscribers retrieved:", subscribers)
        );

    } catch (error) {
        console.error("Error retrieving subscirbers:", error);
        res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

    try {
        const { subscriberId } = req.params

        // Populate the 'channel' field with the 'username' field from the User model
        const subscriptions = await Subscription.find({ subscriber: subscriberId })
            .populate('channel', 'username');

        res.status(200).json(
            new ApiResponse(200, "Subscribed channels retrieved:", subscriptions)
        );

    } catch (error) {
        console.error("Error retrieving subscribed channels:", error);
        res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}