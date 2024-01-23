import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    
    const {tweetContent} = req.body;
    if(!tweetContent){
        throw new ApiError(400,"TweetContent is required!!")
    }
   try {
     const tweet = await Tweet.create({
         content:tweetContent,
         owner:req.user?._id
     })
     if(!tweet){
         throw new ApiError(500,"Unable to create tweet!!")
     }
     return res
     .status(200)
     .json(new ApiResponse(200,tweet,"Tweet published Successfully!!"))
 
   } catch (e) {
    throw new ApiError(500,e?.messgae || " Unable to create tweet")
   }
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!userId){
        throw new ApiError(400,"userId is Required!!!")
    }
    try {
        const tweet = await Tweet.aggregate([{
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },{
            $group:{
                _id:"owner",
                tweets:{$push:"$content"}
            }
            
        },{
            $project:{
                _id:0,
                tweets:1
            }
        }])
        if(!tweet || tweet.length === 0){
            return res
             .status(200)
             .json(new ApiResponse(200, [], "User have no tweets"));
        }
        return res
        .status(200)
        .json(new ApiResponse(200,tweet,"Tweet for the user fetched successfully!"))
    } catch (e) {
        throw new ApiError(500,e?.message || "Unable to fetch tweets")
        
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {tweetContent} = req.body;
    if(!tweetId){
        throw new ApiError(400,"tweetId is required!!")
    }
    if(!tweetContent){
        throw new ApiError(400,"TweetContent is required!!")
    }
   try {
     const existingTweet = await Tweet.findById(tweetId);
     if(!existingTweet){
         throw new ApiError(404,"Tweet doesn't exist")
     }
     //user is owner or not
     if(existingTweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(300,"Unuthorized Access")
     }
     const updatedTweet = await Tweet.findByIdAndUpdate(
         tweetId,
         {
             $set:{
                 content:tweetContent
             }
         },{
             new:true
         }
     )
     if(!updatedTweet){
         throw new ApiError(500,"Unable to update tweet")
     }

     return res
     .status(200)
     .json(new ApiResponse(200,updatedTweet,"Tweet updated Successfully"))

   } catch (e) {
    throw new ApiError(500,e?.message || "Unable to update tweet")
   }

})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const {tweetContent} = req.body;
    if(!tweetId){
        throw new ApiError(400,"tweetId is required!!")
    }
    if(!tweetContent){
        throw new ApiError(400,"TweetContent is required!!")
    }
   try {
     const existingTweet = await Tweet.findById(tweetId);
     if(!existingTweet){
         throw new ApiError(404,"Tweet doesn't exist")
     }
     //user is owner or not
     if(existingTweet.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(300,"Unuthorized Access")
     }
     const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
     if(!deletedTweet){
         throw new ApiError(500,"Unable to delete tweet")
     }

     return res
     .status(200)
     .json(new ApiResponse(200,{},"Tweet deleted Successfully"))


   } catch (e) {
    throw new ApiError(500,e?.message || "Unable to delete tweet")
   }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
