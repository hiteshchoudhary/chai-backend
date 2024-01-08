import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new ApiError(400, `channelId is required `);
    }
    // TODO: toggle subscription
    const isSubscribed = await Subscription.findOne(
        {
            $and:[{subscriber:new mongoose.Types.ObjectId(req.user._id)},
                {
                    channel:new mongoose.Types.ObjectId(channelId)
            }
        ]
        }
    )

    if (!isSubscribed) {
        const subscriber = await Subscription.create({
            subscriber:new mongoose.Types.ObjectId(req.user._id),
            channel:new mongoose.Types.ObjectId(channelId)
        })

        if (!subscriber ) {
            throw new ApiError(500, `something went wrong while toggleSubscription `);
        }

    } else {
        await Subscription.findByIdAndDelete(isSubscribed._id);
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"subscription toggled successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!channelId) {
        throw new ApiError(400, `channelId is required `);
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{channel:new mongoose.Types.ObjectId(channelId)}
        },
        {
            $project:{
                username:1,
                fullName:1,
                avatar:1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,subscribers,"get subscribers successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId) {
        throw new ApiError(400, `subscriberId is required `);
    }

    const subscribed = await Subscription.aggregate([
        {
            $match:{subscriber:new mongoose.Types.ObjectId(subscriberId)}
        },
        {
            $project:{
                username:1,
                fullName:1,
                avatar:1
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,subscribed,"get subscribers successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}