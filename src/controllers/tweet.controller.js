import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a tweet
const createTweet = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { content } = req.body;

    // Validate inputs
    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }
    if (!content) {
        return res.status(400).json({ message: "Content is required" });
    }

    // Create the tweet
    const tweet = await Tweet.create({
        content,
        owner: userId,
    });

    res.status(201).json({
        message: "Tweet created successfully",
        tweet,
    });
});

// Get all tweets for a user
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate userId
    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }

    // Fetch tweets for the user
    const tweets = await Tweet.find({ owner: userId });

    res.status(200).json({
        message: "User tweets retrieved successfully",
        tweets,
    });
});

// Update a tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    // Validate inputs
    if (!isValidObjectId(tweetId)) {
        return res.status(400).json({ message: "Invalid tweetId" });
    }
    if (!content) {
        return res.status(400).json({ message: "Content is required" });
    }

    // Update the tweet
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { content },
        { new: true } // Return the updated tweet
    );

    if (!tweet) {
        return res.status(404).json({ message: "Tweet not found" });
    }

    res.status(200).json({
        message: "Tweet updated successfully",
        tweet,
    });
});

// Delete a tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    // Validate tweetId
    if (!isValidObjectId(tweetId)) {
        return res.status(400).json({ message: "Invalid tweetId" });
    }

    // Delete the tweet
    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if (!tweet) {
        return res.status(404).json({ message: "Tweet not found" });
    }

    res.status(200).json({
        message: "Tweet deleted successfully",
        tweet,
    });
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
};
