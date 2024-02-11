import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//fix the name
const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    if(!channelId){
        throw new ApiError(400,"channelId is Requitred!!")
    }
    const userId = req.user?._id;
    const credential = {subscriber:userId,channel:channelId};
   try {
     const subscribed = await Subscription.findOne(credential);
     if(!subscribed){//not subscribed :- delete the existing one
         const newSubscription = await Subscription.create(credential);
         if(!newSubscription){
             throw new ApiError(500,"Unable to Subscribe channel")
         }
         return res
         .status(200)
         .json(new ApiResponse(200,newSubscription,"Channel Subscribed Successfully!!"))
     }
     else{
         //subscribed :-delete the subscription
         const deletedSubscription = await Subscription.deleteOne(credential);
         if(!deletedSubscription){
             throw new ApiError(500,"Unable to Unsubscribe channel")
         }
         return res
         .status(200)
         .json(new ApiResponse(200,deletedSubscription,"Channel Unsubscribed Successfully!!"))
     }
   } catch (e) {
     throw new ApiError(500,e?.message || "Unable to toggle subscription")
   }
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    if(!subscriberId){
        throw new ApiError(400,"channelId is Requitred!!")
    }
   try {
   
     const subscribers = await Subscription.aggregate([{
         $match:{
             channel : new mongoose.Types.ObjectId(subscriberId)
         },
     },{
         $group:{
             _id:"channel",
             subscribers:{$push:"$subscriber"}
         }
     },{
         $project:{
             _id:0,
             subscribers:1
         }
     }])
     
     if(!subscribers || subscribers.length === 0 ){
         return res
         .status(200)
         .json(new ApiResponse(200, [], "No subscribers found for the channel"));
 
     }
     return res
     .status(200)
     .json(new ApiResponse(200,subscribers,"All Subscribers fetched Successfully!!"))
     
   } catch (e) {
    throw new ApiError(500,e?.message || "Unable te fetch subscribers!")
    
   }
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if(!channelId){
        throw new ApiError(400,"subscriberId is Requitred!!")
    }
    try {
   
        const subscribedChannels = await Subscription.aggregate([{
            $match:{
                subscriber : new mongoose.Types.ObjectId(channelId)
            },
        },{
            $group:{
                _id:"subscriber",
                subscribedChannels:{$push:"$channel"}
            }
        },{
            $project:{
                _id:0,
                subscribedChannels:1
            }
        }])
        
        if(!subscribedChannels || subscribedChannels.length === 0 ){
            return res
            .status(200)
            .json(new ApiResponse(200, [], "No subscribedChannel found for the user"));
    
        }
        return res
        .status(200)
        .json(new ApiResponse(200,subscribedChannels,"All SubscribedChannels fetched Successfully!!"))
        
      } catch (e) {
       throw new ApiError(500,e?.message || "Unable te fetch subscribedChannels!")
       
      }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}