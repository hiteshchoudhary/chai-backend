import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    
    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

    const tweet= await Tweet.create({
        content:content,
        owner:req.user._id
    })

    return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"))


})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params

    if(!userId?.trim()){
        throw new ApiError(400, "User id is required")
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const user= await User.aggregate([

        {
            $match:{
                _id:new mongoose.Types.ObjectId(userId)

            }
        },
        {
            $lookup:{
                from:"tweets",
                localField:"_id",
                foreignField:"owner",
                as:"tweets"
            }
        },
        // unwind the tweets array to get individual tweets
        {
            $unwind:"$tweets"
        },
        // project the required fields
        {
            $project:{
                _id:1,
                name:1,
                username:1,
                avatar:1,
                tweet:{
                    _id:"$tweets._id",
                    content:"$tweets.content",
                    createdAt:"$tweets.createdAt",
                    updatedAt:"$tweets.updatedAt",
                    owner:"$tweets.owner"
                }
            }
        }

    ])

    if(!user?.length){
        throw new ApiError(404, "User not found")
    }

    return res.status(200).
    json(new ApiResponse(200, user, "User tweets fetched successfully"))


})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body

    if (!tweetId?.trim()) {
        throw new ApiError(400, "Tweet id is required")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required")
    }

    const tweet =await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content: content
        },
        {
            new: true
        }
    )

    if(!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    return res.status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"))


})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if (!tweetId?.trim()) {
        throw new ApiError(400, "Tweet id is required")
    }

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }
return res.status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
