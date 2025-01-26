import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    try{
        const {subscriberId, channelId} = req.body;
        if(!subscriberId || !channelId){
            next(new ApiError(400, "Subscriber and Channel ID are required"))
        }

        const existingSubscription = await Subscription.findOne({subscriber: subscriberId, channel: channelId})
        if(existingSubscription){
            await Subscription.deleteOne({_id: existingSubscription._id});
            next(new ApiResponse(200, "Unsubscribed successfully"))
        } else{
            const newSubscription = new Subscription({
                subscriber: subscriberId,
                channel: channelId
            })

            await newSubscription.save();
            next(new ApiResponse(201, "Subscribed successfully"))
        }
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    try{
        const subscriptions = await Subscription.find({channel: channelId}).populate("subscriber").exec();
        if(!subscriptions){
            next(new ApiError(404, "No subscribers found"))
        }

        const subscribers = subscriptions.map(sub => sub.subscriber);
        return new ApiResponse(200, subscribers);
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    try{
        const subscriptions = await Subscription.find({subscriber: subscriberId}).populate("channel").exec();
        if(!subscriptions){
            next(new ApiError(404, "No channels found"))
        }

        const channels = subscriptions.map(sub => sub.channel);
        return new ApiResponse(200, channels);
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}