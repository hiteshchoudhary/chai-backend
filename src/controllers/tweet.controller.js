import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;
    const userId = req.user?._id;

    if (!content) {
        throw new ApiError(400, "Tweet content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: userId
    })

    if (!tweet) {
        throw new ApiError(500, "Error while creating Tweet");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,tweet,"Tweet created successfully")
        )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;
   
    const user = await User.findById(userId)
    if(!user){
        throw new ApiError(400,"User not found")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likeCount"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likeCount"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $unwind: "$owner"
        }
    ])

    if(!tweets.length){
        throw new ApiError(500,"No tweets found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,tweets,"Tweets fetched successfully")
        )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const userId = req.user?._id;
    const {tweetId} = req.params;
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Tweet ID");
    }

    const {content} = req.body;
    if(!content){
        throw new ApiError(400, "Updated content is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if(tweet.owner.toString() !== userId.toString()){
        throw new ApiError(403, "Unauthorized to update this tweet");
    }

    tweet.content=content;
    await tweet.save({validateBeforeSave:false})

    return res
        .status(200)
        .json(
            new ApiResponse(200,tweet,"Tweet updated successfully")
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
    const userId = req.user?._id;

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"Tweet not found")
    }
    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to delete this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Tweet deleted successfully")
        )

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
