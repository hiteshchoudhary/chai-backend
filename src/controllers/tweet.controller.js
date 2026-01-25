import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const {content} = req.body

    if(!content || content.trim() === ""){
        throw new ApiError(400,"Content is required")
    }

    const newTweet = await Tweet.create({
        owner: userId,
        content: content.trim()
    })

    if(!newTweet){
        throw new ApiError(500,"Couldn't create tweet.")
    }

    const populatedDoc = await newTweet.populate("owner","avatar fullName username")

    return res.status(201).json(new ApiResponse(201,populatedDoc,"Successfully created new tweet."))
    
    //TODO: create tweet
})

const getUserTweets = asyncHandler(async (req, res) => { 
    const {userId} = req.params;
    const {limit=10, page=1} = req.query;

    const fetchUserTweets= Tweet.aggregate([{
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[{
                $project:{
                    avatar:1,
                    username:1,
                }
            }]
        }
    },
    {
        $addFields:{
            owner:{$first:"$owner"}
        }
    },
    {
        $sort:{
            createdAt:-1
        }
    }
])

const options = {
    limit: parseInt(limit),
    page: parseInt(page)
}

const paginatedUsertweets = await Tweet.aggregatePaginate(fetchUserTweets,options)

if(!paginatedUsertweets){
    throw new ApiError(500,"Couldn't fetch tweets.Try again.")
}
return res.status(200).json(new ApiResponse(200,paginatedUsertweets,"Successfully fetched user Tweets"))

    // TODO: get user tweets
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body;
    const userId = req.user?._id;


    if(!content || content.trim() === ""){
        throw new ApiError(400, "Content is required.")
    }

    const editTweet = await Tweet.findOneAndUpdate({
        _id: new mongoose.Types.ObjectId(tweetId),
        owner: new mongoose.Types.ObjectId(userId)
    },
    {
        $set:{
            content: content.trim()
        }
    },
    {
        new:true
    }
    )

    if(!editTweet){
        throw new ApiError(404, "Tweet not found or You're not the authorized to edit it.")
    }

    return res.status(200).json(new ApiResponse(200,editTweet,"Successfully updated tweet."))
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const userId = req.user?._id;

    const deletedTweet = await Tweet.findOneAndDelete({
        _id: new mongoose.Types.ObjectId(tweetId),
        owner: new mongoose.Types.ObjectId(userId)
    })
     
    if(!deletedTweet){
        throw new ApiError(404,"Tweet not found or you're not authorized to delete it.")
    }
    return res.status(200).json(new ApiResponse(200,{},"Successfully deleted."))

    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
