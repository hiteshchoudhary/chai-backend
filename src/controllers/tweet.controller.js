import mongoose, { isValidObjectId} from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"

// create tweet
const createTweet = asyncHandler( async(req, res)=>{
    const {content} = req.body;

    if(!content || content?.trim()===""){
        throw new ApiError(400, "content is required")
    }
    
    // creating tweet 
    const tweet =  await Tweet.create({
        content,
        owner: req.user._id
    })

    if(!tweet){
        throw new ApiError(500, "something went wrong while creating tweet")
    }

    // return responce
    return res.status(201).json(
        new ApiResponse(200, tweet, "tweet created successfully!!")
    );
   
})

// update the tweet 
const updateTweet = asyncHandler(async (req, res) => {
    const { newContent } = req.body
    const { tweetId } = req.params
    

    if(!newContent || newContent?.trim()===""){
        throw new ApiError(400, "content is required")
    }

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "This tweet id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)
    
    if (!tweet) {
        throw new ApiError(404, "Tweet not found!");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this tweet!");
    }

    
    const updateTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content:newContent 
            }  
        },
        {
            new:true
        }
    )

   if(!updateTweet){
    throw new ApiError(500, "something went wrong while updating tweet")
   }

   // return responce
   return res.status(201).json(
    new ApiResponse(200, updateTweet, "tweet updated successfully!!"))
})

// delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "This tweet id is not valid")
    }

    const tweet = await Tweet.findById(tweetId)
    
    if (!tweet) {
        throw new ApiError(404, "no tweet found!");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to delete this tweet!");
    }

    const deleteTweet = await Tweet.deleteOne(req.user._id)

    // console.log("delete successfully", deleteTweet)

    if(!deleteTweet){
        throw new ApiError(500, "something went wrong while deleting tweet")
       }
    
       // return responce
       return res.status(201).json(
        new ApiResponse(200, deleteTweet, "tweet deleted successfully!!"))
})

// get all tweets
const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "This user id is not valid")
    }

   // find user in database 
    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // match and find all tweets
    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner: user._id,
            }
            
        }
    ]);

    if(!tweets){
        throw new ApiError(500, "something went wrong while fetching tweets")
    
    }
    // return responce
     return res.status(201).json(
        new ApiResponse(200, tweets, "tweets fetched  successfully!!"))
})

export {
    createTweet,
    updateTweet,
    deleteTweet,
    getUserTweets,
}