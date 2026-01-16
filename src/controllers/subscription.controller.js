import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const deltedSubscription=await Subscription.findOneAndDelete(
        {
            channel:channelId,
            subscriber:req.user._id
        }
    )
    if (!deltedSubscription) {
        const newSubscription=await Subscription.create({
            channel:channelId,
            subscriber:req.user._id
        })
        res.status(200).json(new ApiResponse(200,newSubscription,"subscription created successfully"))
    }
    else{
    res.status(200).json(new ApiResponse(200,deltedSubscription,"subscription deleted successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId,page=1,limit=25,sortBy="createdAt",sortType="desc"} = req.query
    const skip=(Number(page)-1)*Number(limit);
    const sortTypeNum=sortType=="asc"?1:-1;
    if (!channelId) {
        throw new ApiError(403,"channelId is required");
    }
    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $skip:skip
        },
        {
            $limit:Number(limit)
        },
        {
            $sort:{
                [sortBy]:sortTypeNum
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline:[
                    {
                $project:{
                    userName:1,
                    fullName:1,
                    email:1,
                    avatar:1
                }
            }
        ]
            }

        },
        {
            $project:{
                _id:0,
                subscriber:1
            }
        }
    ])
    res.status(200).json(new ApiResponse(200,subscribers,"subscribers retrieved successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    // const { subscriberId } = req.params
    const subscribedChannels=await Subscription.aggregate([
        {
            $match:{
                subscriber:req.user._id
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline:
            [
                {
                $project:{
                    userName:1,
                    fullName:1,
                    email:1,
                    avatar:1
                }
            }
        ]
            },
        }
    ]);
    res.status(200).json(new ApiResponse(200,subscribedChannels,"subscribed channels retrieved successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}