import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!channelId){
        throw new ApiError(400, "Not found channel id");
    }

    const channel = await User.findById(channelId);
    if(!channel){
        throw new ApiError(404, "Channel does not exits");
    }

    const user = await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(404, "User not founded");
    }

    const subscriber = await Subscription.find({
        subscriber: isValidObjectId(req.user?._id),
        channel: isValidObjectId(channelId)
    })

    let toggle;
    if(!subscriber){
        toggle =  await Subscription.create({
            subscriber: req?.user.id,
            channel: channelId
        })
        if(!toggle){
            throw new ApiError(400, "Something went wrong")
        }
    }else{
        toggle = await Subscription.findByIdAndDelete(subscriber._id)
    }

    // subscriber && await Subscription.findByIdAndDelete(subscriber._id)
    // !subscriber && await Subscription.create({subscriber: req?.user.id, channel: channelId})

    res.status(200).json(
        new ApiResponse(200, toggle, "Successfully toggled the state")
    )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId){
        throw new ApiError(400, "Not found channel id");
    }

    const channel = await User.findById(channelId);
    if(!channel){
        throw new ApiError(404, "Channel does not exits");
    }

    const aggregate = [
        {
            $match: {
                channel: channelId
            }
        },{
            $group: {
                _id: null,
                totalCount: { $sum: 1 } // Count the number of documents
            }
        }
    ]


const subscriberList = await Subscription.aggregate(aggregate);

if(!subscriberList){
    throw new ApiError(404, "Subscriberes not founded");
}

res.status(200).json(
    new ApiResponse(200, subscriberList, "Successfully got the subscribers")
)
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