import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    try{
        const {tweet} = req.body;
        const userId = req.user.id;

        if(!tweet){
            return next(new ApiError(400, "Tweet is required"))
        }

        const newTweet = new Tweet({
            content: tweet,
            owner: userId
        })

        await newTweet.save();

        new ApiResponse(201, newTweet)
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    try{
        const {userId} = req.params;
        if(!isValidObjectId(userId)){
            return next(new ApiError(400, "Invalid user id"))
        }

        const user = await User.findOne({_id: userId});
        if(!user){
            return next(new ApiError(404, "User not found"))
        }

        const tweets = await Tweet.find({owner: userId}).sort({createdAt: -1});

        next(new ApiResponse(200, tweets))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    try{
        const {tweetId} = req.params;
        const {content} = req.body;

        if(!isValidObjectId(tweetId)){
            return next(new ApiError(400, "Invalid tweet id"))
        }

        const tweet = await Tweet.findOne({_id: tweetId});
        if(!tweet){
            return next(new ApiError(404, "Tweet not found"))
        }

        if(tweet.owner.toString() !== req.user.id){
            return next(new ApiError(403, "You are not authorized to update this tweet"))
        }

        if(!content){
            return next(new ApiError(400, "Content is required"))
        }

        tweet.content = content;
        await tweet.save();

        next(new ApiResponse(200, tweet))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    try{
        const {tweetId} = req.params;
        if(!isValidObjectId(tweetId)){
            return next(new ApiError(400, "Invalid tweet id"))
        }

        const tweet = await Tweet.findOne({_id: tweetId});
        if(!tweet){
            return next(new ApiError(404, "Tweet not found"))
        }

        if(tweet.owner.toString() !== req.user.id){
            return next(new ApiError(403, "You are not authorized to delete this tweet"))
        }

        await tweet.remove();

        next(new ApiResponse(204, {}))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
