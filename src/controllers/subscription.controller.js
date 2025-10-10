<<<<<<< HEAD
import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
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
=======
import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponses.js"
import { asyncHandler } from "../utils/asyncHandler.js"



const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const userID = req.user._id;
    // we are looking for already existing subscription 
    const presentSubscription = await Subscription.findOne({
        subscriber: userID,
        channel: channelId

    })

    if (!presentSubscription) {
        const newSubscription = await Subscription.create(
            {
                subscriber: userID,
                channel: channelId


            }
        )

        res.status(200)
            .json(
                new ApiResponse(202, newSubscription, "Subsribed SuccessFully")
            )
    }

    else {

        // Different ways to delete a record , in this case subscription 
        // Subscription.deleteOne({ _id: presentSubscription._id })
        // Subscription.findOneAndDelete(presentSubscription)
        await Subscription.findByIdAndDelete(presentSubscription._id);
        res.status(200)
            .json(new ApiResponse(202, "Unsubscribbed successfully"))

    }



})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const allSubscribers = await Subscription.find({
        channel: subscriberId

    })



    // 1st way to return the list of all the subscribers
    // const subList = await User.populate(allSubscribers, { path: "subscriber", select: " fullName email " })
    // 2nd way to return the list of subscribers 
    const subList = await User.find({
        _id: allSubscribers.map(sub => sub.subscriber)
    }).select("username email")

    res.status(200).json(new ApiResponse(200, subList, "Subscribers fetched successfully"))

})



export { toggleSubscription, getUserChannelSubscribers }
>>>>>>> myrepo/main
