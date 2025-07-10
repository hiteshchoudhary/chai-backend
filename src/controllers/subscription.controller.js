import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!channelId?.trim()){
        throw new ApiError(400, "Channel id is required")
    }
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }

    // const user= await User.aggregate([
    //     {
    //         $match:{
    //             _id:new mongoose.Types.ObjectId(channelId)
    //         } 
    //     },
    //     {
    //         $lookup:{
    //             from:"subscriptions",
    //             localField:"_id",
    //             foreignField:"channel",
    //             as:"subscribers"
    //         }
    //     },
    //     {
    //         $unwind:"$subscribers"
    //     },
    //     {
    //         $match:{
    //             "$subscribers.subscriber":new mongoose.Types.ObjectId(req.user._id)
    //         }

    //     }

    // ])
    
    // let subscription = undefined
    // //if user is subscribed to the channel, unsubscribe it
    // if(user.length === 1 && user[0].subscibers.subscriber === req.user._id){
    //     subscription = await Subscription.findByIdAndDelete(req.user._id)
    // }
    // //if user is not subscribed to the channel, subscribe it
    // else{
    //     subscription = await Subscription.create({
    //         channel:channelId,
    //         subscriber:req.user._id
    //     })
    // }

    // if(!subscription){
    //     throw new ApiError(500, "Failed to toggle subscription")
    // }

    // return res
    // .status(200)
    // .json(new ApiResponse(200, subscription, "Subscription toggled successfully"))

    let subscriber = undefined
    // Check if the user is already subscribed to the channel
    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id,
    });

    // If the user is already subscribed, unsubscribe them

    if (existingSubscription) {
        subscriber=await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200, subscriber, "Unsubscribed successfully"));
    }

    // If the user is not subscribed, subscribe them
    else {
        subscriber = await Subscription.create({
            channel: channelId,
            subscriber: req.user._id,
        });
    }

    if (!subscriber) {
        throw new ApiError(500, "Failed to toggle subscription");
    }

    return res.status(200).
    json(new ApiResponse(200, subscriber, "Subscripe  successfully"));

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId?.trim()){
        throw new ApiError(400, "Channel id is required")
    }
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }

    const subscribers = await Subscription.find({
        channel:channelId
    })

    if(!subscribers){
        throw new ApiError(404, "No subscribers found")
    }
   

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers of fetched successfully"))

    
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const subscriberId = channelId
    console.log("subscriberId", req.params)
    console.log("subscriberId", subscriberId)

    if (!subscriberId?.trim()) {
        throw new ApiError(400, "Subscriber id is required")
    }
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }

    const subscriptions = await Subscription.find({
        subscriber: subscriberId,
    })

    if (!subscriptions) {
        throw new ApiError(404, "User has not subscribed to any channels")
    }

    res.status(200).json(
        new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully")
    )
    

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}