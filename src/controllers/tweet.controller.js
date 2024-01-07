import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    // TODO: create a new tweet
    try {
        const { content, owner } = req.body;

        // Check if the user (owner) exists
        const user = await User.findById(owner);
        if (!user) {
            throw new ApiError(404, "User not found")
        }

        const newTweet = await Tweet.create({
            content,
            owner,
        });

        res.status(201).json(
            new ApiResponse(200, "Tweet created:", newTweet)
        );
    } catch (error) {
        console.error("Error creating tweet:", error);
        res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
});

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    
    try {
        const userId = req.params.userId; 

        // Find tweets by the specified user ID
        const tweets = await Tweet.find({ owner: userId })
            .populate('owner', 'username');  

        res.status(200).json(
            new ApiResponse(200, "Tweets retrieved:", tweets)
        );
    } catch (error) {
        console.error("Error while retrieving tweets:", error);
        res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    try{
        const {tweetId,updatedContent} = req.body

        const tweet = await Tweet.findById(tweetId)

        
        // Check if the tweet exists
        if (!tweet) { 
            throw new ApiError(404, "Tweet not found")
        }
    
        tweet.content = updatedContent
        await tweet.save({validateBeforeSave: false})
    
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet changed successfully"))
    }
    catch (error) {
        console.error("Error updating tweet:", error);
        return res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
   
})


const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    try {
        const { tweetId } = req.body;
        const userId = req.user.id;
 
        const tweet = await Tweet.findById(tweetId);

        // Check if the tweet exists
        if (!tweet) {
            throw new ApiError(404, "Tweet not found")
        }

        // Check if the authenticated user is the owner of the tweet
        if (tweet.owner.toString() !== userId) {
            return res.status(403).json(
                new ApiResponse(403, "Unauthorized: You are not the owner of this tweet")
            );
        }

        // Delete the tweet
        await tweet.remove();
 
        return res.status(200).json(
            new ApiResponse(200, {}, "Tweet deleted successfully")
        );
    } catch (error) {
        console.error("Error deleting tweet:", error);
        return res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
