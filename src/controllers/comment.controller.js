import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate videoId
    if (!mongoose.isValidObjectId(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    // Fetch comments with pagination
    const comments = await Comment.find({ video: videoId })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    // Count total comments
    const totalComments = await Comment.countDocuments({ video: videoId });

    res.status(200).json({
        message: "Comments retrieved successfully",
        comments,
        metadata: {
            totalComments,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalComments / limit),
        },
    });
});

// Add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { content, videoId, userId } = req.body;

    // Validate inputs
    if (!content || !mongoose.isValidObjectId(videoId) || !mongoose.isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid inputs" });
    }

    // Create the comment
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId,
    });

    res.status(201).json({
        message: "Comment added successfully",
        comment,
    });
});

// Update a comment
const updateComment = asyncHandler(async (req, res) => {
    const { ownerId, commentId, newComment } = req.body;

    // Validate inputs
    if (!newComment || !mongoose.isValidObjectId(ownerId) || !mongoose.isValidObjectId(commentId)) {
        return res.status(400).json({ message: "Invalid inputs" });
    }

    // Update the comment
    const result = await Comment.updateOne(
        { owner: ownerId, _id: commentId },
        { content: newComment }
    );

    if (result.matchedCount === 0) {
        return res.status(404).json({ message: "Comment not found or not owned by user" });
    }

    res.status(200).json({
        message: "Comment updated successfully",
    });
});

// Delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const { ownerId, commentId } = req.body;

    // Validate inputs
    if (!mongoose.isValidObjectId(ownerId) || !mongoose.isValidObjectId(commentId)) {
        return res.status(400).json({ message: "Invalid inputs" });
    }

    // Delete the comment
    const result = await Comment.deleteOne({ owner: ownerId, _id: commentId });

    if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Comment not found or not owned by user" });
    }

    res.status(200).json({
        message: "Comment deleted successfully",
    });
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
};
