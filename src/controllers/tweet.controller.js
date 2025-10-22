import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    /*
    1. getting the content from the req.body.
    2. Check the availability of the content.
    3. using the user from the req.user & then saving it to the tweet db schema.
    4. sending the response.
    */

    const { content } = req.body;
    if (!content) {
        throw new ApiError(400, "Content is required.")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    })

    if (!tweet) {
        throw new ApiError(400, "Tweet Creation Failed")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Tweet Created Successfully")
        )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;

    const tweets = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweets"
            }
        },
        {
            $unwind: "$tweets"
        },
        {
            $lookup: {
                from: "likes",
                let: { tweetId: "$tweets._id" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$tweet", "$$tweetId"] } } },
                    { $count: "count" }
                ],
                as: "likesCount"
            }
        },
        {
            $addFields: {
                "tweets.likesCount": {
                    $ifNull: [{ $arrayElemAt: ["$likesCount.count", 0] }, 0]
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                fullName: { $first: "$fullName" },
                username: { $first: "$username" },
                email: { $first: "$email" },
                avatar: { $first: "$avatar" },
                tweets: { $push: "$tweets" }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                email: 1,
                avatar: 1,
                tweets: 1
            }
        }
    ]);


    return res
        .status(200)
        .json(
            new ApiResponse(200, tweets, "Getting User Tweets Successful")
        )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { newContent } = req.body;

    if (!newContent) {
        throw new ApiError(400, "Invalid Content")
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set: {
                content: newContent
            }
        },
        {
            new: true
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Updated Tweet Successfully")
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "Deleted Tweet Successfully")
        )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
