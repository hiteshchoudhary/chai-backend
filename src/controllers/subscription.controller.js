import mongoose, {isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params;
    if(!channelId?.trim() || !isValidObjectId(channelId)){
        throw new ApiError(400, "Channel id is required");
    }

    const channel = await User.findById(channelId.trim());
    if(!channel){
        throw new ApiError(404, "Channel not found");
    }

    const isSubscribed = await Subscription.findOne({
        channel: channelId.trim(),
        subscriber: req.user?._id
    });

    let isSubscribing;
    if(!isSubscribed){
        await Subscription.create({
            channel: channelId.trim(),
            subscriber: req.user?._id
        });
        isSubscribing = true;
    }else{
        await Subscription.deleteOne({channel: channelId.trim(), subscriber: req.user?._id});
        isSubscribing = false;
    }

    const message = isSubscribing ? "Susbcribe channel success" : "Unsubscribe channel success";
    res.status(200).json(new ApiResponse(
        200,
        {},
        message
    ));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    //id of user whose subscribed channel list is to be found
    //don't know why to do that we can simply get logged in user subscribed channels by using req.user._id
    const { userId } = req.params;
    if(!userId?.trim() || !isValidObjectId(userId)){
        throw new ApiError(400, "userId is required");
    }
    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId.trim())
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
                            fullname: 1,
                            avatar: 1,
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
                _id: 0
            }
        },
        {
            $replaceRoot: {
                newRoot: "$channel"
            }
        }
    ]);

    res.status(200).json(new ApiResponse(
        200,
        channels,
        "Get subscribed channel list success"
    ));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    //id of user(channel) whose subscribers list is to be found
    //don't know why to do that we can simply get logged in user(channel) subscribers list by using req.user._id
    const {channelId} = req.params; 
    if(!channelId?.trim() || !isValidObjectId(channelId)){
        throw new ApiError(400, "channelId is required");
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId.trim())
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribersList",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        }, 
        {
            $addFields: {
                subscribersList: {
                    $first: "$subscribersList"
                }
            }
        }, 
        {
            $project: {
                subscribersList: 1,
                _id: 0
            }
        },
        {
            $replaceRoot: {
                newRoot: "$subscribersList"
            }
        }
    ]);

    res.status(200).json(new ApiResponse(
        200,
        subscribers,
        "Get channel subscribers list success"
    ));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}