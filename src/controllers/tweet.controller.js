<<<<<<< HEAD
import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
=======
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponses.js";
import jwt from "jsonwebtoken";

const createTweet = asyncHandler(async (req, res) => {
    const content = req?.body.content;
    console.log("Console here nnnnnnnn", content);

    const owner = req?.user._id;
    console.log("Console here nnnnnnnn", owner);

    const createTweet = await Tweet.create({
        content: content,
        owner: owner,
        name: req.user.username,

    });

    if (!createTweet) throw new ApiError(402, "Tweet not saved on the database ")


    return res.status(200)
        .json(new ApiResponse(202, createTweet, "Tweet has been created suceesfully "))

})
// 1st method , here i am extracting the userId from the cookies , and then finding the every tweet made by that user 
/*
const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    // In this method , I will be extracting every tweet of that user 
    const userTweets = (await Tweet.find({ owner: userId }).select("content -_id "));
    return res
        .status(200)
        .json(new ApiResponse(200, userTweets, "User tweet fetched successfully"))
})
*/
// 2nd Method 
// Here , the default route , which is chai and code gave 
const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.params;
    //  here  we can also do  the destructring like const{userId} = req.params
    console.log("This is the log hihi ", userId.userId);


    // In this method , I will be extracting every tweet of that user 
    const userTweets = (await Tweet.find({ owner: userId.userId }).select("content -_id "));
    return res
        .status(200)
        .json(new ApiResponse(200, userTweets, "User tweet fetched successfully"))
})
const updateTweet = asyncHandler(async (req, res) => {
    const tweetId = req.params.tweetId;
    const { content } = req.body;
    const UpdatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        content: content
    },
        {
            new: true
        }
    ).select("content")


    res.status(200)
        .json(new ApiResponse(202, UpdatedTweet, "Tweet Updated "))
})



const deleteTweet = asyncHandler(async (req, res) => {
    const tweetId = req.params.tweetId;
    await Tweet.findByIdAndDelete(tweetId)
    res.status(200)
        .json(new ApiResponse(202, "Tweet Deleted SuccessFully!!!"))
})


export { createTweet, getUserTweets, updateTweet, deleteTweet }
>>>>>>> myrepo/main
