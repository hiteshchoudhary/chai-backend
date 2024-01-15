import {Types, isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

// create tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const userId = req.user._id;

    // check if content is empty
    if (!content) {
        throw new ApiError(400, "Tweet Content is required!")
    }

    const tweet = await Tweet.create({
        content,
        owner: userId
    })

    if (!tweet) {
        throw new ApiError(500, "Something went wrong while creating tweet!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Tweet created successfully"
    ))
})

// update tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { newContent } = req.body;
    const { tweetId } = req.params;
    const userId = req.user._id;

    // Check if Invalid tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId!");
    }

    // Check if newContent is provided
    if (!newContent) {
        throw new ApiError(400, "New content is required!");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found!");
    }

    if (tweet.owner.toString() !== userId) {
        throw new ApiError(403, "You do not have permission to update this tweet!");
    }

    // Update tweet with new content
    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        { $set: { content: newContent } },
        { new: true }
    );

    if (!updatedTweet) {
        throw new ApiError(500, "Something went wrong while updating the tweet, try again");
    }

    return res.status(200).json(new ApiResponse(
        200,
        { tweet: updatedTweet },
        "Tweet updated successfully"
    ));
});

// delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const userId = req.user._id;

    // check if Invalid tweetId
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found!");
    }

    if (tweet.owner.toString() !== userId) {
        throw new ApiError(403, "You do not have permission to delete this tweet!");
    }

    // delete the tweet
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if (!deletedTweet) {
        throw new ApiError(500, "Something went wrong while deleting tweet!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Tweet deleted successfully"
    ))
})

// get user tweets
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // check if Invalid userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId!");
    }

    const user = await User.findOne({ _id: userId });
    if (!user) {
        throw new ApiError(404, "User not find!");
    }

    const tweets = await Tweet.find({ owner: userId });

    return res.status(200).json(new ApiResponse(
        200,
        { tweets },
        "Tweets fetched successfully"
    ))
})


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}