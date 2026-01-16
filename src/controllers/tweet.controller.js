import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const tweet=await Tweet.create({
        content:req.query.content,
        owner:req.user._id
    })
     if (!tweet) {
        throw new ApiError(506,"error creating tweet");
    }
    res.status(200).json(new ApiResponse(200,tweet,"tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const tweets=await Tweet.find({
        owner:req.params.userId
    })
    res.status(200).json(new ApiResponse(200,tweets,"user tweets retrieved successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId,newContent}=req.query;
    if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(405,"tweet id not valid");
    }
    const newTweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:newContent
            }
        },
        {
            new:true
        }
    )
    if (!newTweet) {
        throw new ApiError(406,"tweet not found");
    }
    res.status(200).json(new ApiResponse(200,newTweet,"tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.query;

    if (!tweetId || !mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(405,"tweet id not valid");
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deletedTweet) {
        throw new ApiError(406,"tweet not found");
    }
        return res.status(200).json(new ApiResponse(200,deletedTweet,"tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
