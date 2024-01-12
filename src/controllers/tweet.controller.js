import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const content = req.body?.content?.trim();
    if(!content){
        throw new ApiError(400, "Tweet content is required!!");
    }
    let tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user?._id
    });

    if(!tweet){
        throw new ApiError(500, "Something went wrong while creating tweet");
    }

    tweet = await Tweet.findById(tweet._id).populate("owner", "fullname username avatar");

    res.status(201).json(new ApiResponse(
        201,
        tweet,
        "Create tweet success"
    ));
});

const getUserTweets = asyncHandler(async (req, res) => {
    let {page = 1, limit = 10, userId} = req.params;
    if(!userId?.trim() || !isValidObjectId(userId)){
        throw new ApiError(400, "userId is required to get tweets");
    }
    page = isNaN(page) ? 1 : Number(page);
    limit = isNaN(limit) ? 10 : Number(limit);
    if(page <= 0){
        page = 1;
    }
    if(limit <= 0){
        page = 10;
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
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
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        },
        {
            $sort:{
                createdAt: -1
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ]);

    res.status(200).json(new ApiResponse(
        200,
        tweets,
        "Get user tweets success"
    ));
});

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if(!tweetId?.trim() || !isValidObjectId(tweetId)){
        throw new ApiError(400, "tweetId is required to update tweet");
    }
    let content = req.body?.content?.trim();
    if(!content){
        throw new ApiError(400, "Tweet content is required to update");
    }

    let tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    if(tweet.owner?.toString() !== req.user?._id?.toString()){
        throw new ApiError(401, "You cannot update this tweet");
    }

    tweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {
            content
        }
    }, {new:true});

    res.status(200).json(new ApiResponse(
        200,
        tweet,
        "Tweet update success"
    ));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if(!tweetId?.trim() || !isValidObjectId(tweetId)){
        throw new ApiError(400, "tweetId is required to update tweet");
    }

    let tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found");
    }

    if(tweet.owner?.toString() !== req.user?._id?.toString()){
        throw new ApiError(401, "You cannot delete this tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    res.status(200).json(new ApiResponse(
        200,
        {},
        "Tweet delete success"
    ));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}