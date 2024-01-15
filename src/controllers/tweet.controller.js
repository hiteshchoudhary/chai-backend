import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User, User, User, User, User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, "content is required to tweet !");
    }

    const newTweet = await Tweet.create({
        content,
        owner: req.user?._id,
    });

    if (!newTweet) {
        throw new ApiError(500, "Error while creating Tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, newTweet, "Tweet created successfully !"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;
    if (!userId.trim() || !isValidObjectId(userId)) {
        throw new ApiError(400, "userId is required or invalid!")
    }
    const user = await  User.findById(userId);

    if (!user) {
        throw new ApiError(400, "user not found");
    }
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            '$lookup': {
                'from': 'users',
                'localField': 'owner',
                'foreignField': '_id',
                'as': 'owner',
                'pipeline': [
                    {
                        '$project': {
                            'fullname': 1,
                            'avatar': 1,
                            'username': 1
                        }
                    }
                ]
            }
        },
        {
            '$lookup': {
                'from': 'likes',
                'localField': '_id',
                'foreignField': 'tweet',
                'as': 'likeCount'
            }
        }, {
            '$addFields': {
                'likeCount': {
                    '$size': '$likeCount'
                }
            }
        }, {
            '$addFields': {
                'owner': {
                    '$first': '$owner'
                }
            }
        }
    ]);

    if (tweets.length == 0) {
        throw new ApiError(400, "No tweets Available");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "tweets fetched successfully !"));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    if (!tweetId.trim() || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweetid is required or invalid!")
    }
    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "content is required!");
    }
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(400, "tweet not found!");
    }

    if ((tweet.owner).toString() != (req.user?._id).toString()) {
        throw new ApiError(401, "Unauthorised user!");
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content,
            },
        },
        {
            new: true,
        }
    );

    if (!updatedTweet) {
        throw new ApiError(500, "error while updating tweet");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTweet, "updated Tweet succssfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;
    if (!tweetId.trim() || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweetid is required or invalid!")
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(400, "tweet not found!");
    }
    if ((tweet.owner).toString() != (req.user?._id).toString()) {
        throw new ApiError(401, "Unauthorised user!");
    }
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deleteTweet) {
        throw new ApiError(400, "error while deleting tweet!");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "deleted tweet succssfully!"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
