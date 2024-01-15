import { Types, isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// add comment to video or tweet
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.query;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content) {
        throw new ApiError(400, "Comment content is required");
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId!");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found!");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    });

    res.status(201).json(new ApiResponse(
        201,
        { comment },
        "Comment added successfully"
    ));
});

// update comment by commentId
const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { newContent } = req.body;
    const userId = req.user._id;

    // check if invalid commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId!");
    }

    if (!newContent) {
        throw new ApiError(400, "New Content is required!");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!");
    }

    if (comment.owner.toString() !== userId) {
        throw new ApiError(403, "You do not have permission to update this comment!");
    }

    // update comment with new content
    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
        $set: {
            content: newContent
        }
    }, { new: true })

    if (!updatedComment) {
        throw new ApiError(404, "Something went wrong while updating comment!");
    }

    res.status(201).json(new ApiResponse(
        201,
        { updatedComment },
        "Comment updated successfully"
    ));
})

// delete comment by commentId
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    // check if invalid commentId
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId!");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found!");
    }

    if (comment.owner.toString() !== userId) {
        throw new ApiError(403, "You do not have permission to update this comment!");
    }

    // delete the comment
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(404, "Something went wrong while deleting comment!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Comment deleted successfully"
    ))
})

// get video comments
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    // check if Invalid videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId!");
    }

    const aggregate = Comment.aggregate([
        {
            $match: {
                video: new Types.ObjectId(videoId)
            }
        }
    ])

    Comment.aggregatePaginate(aggregate, { page, limit })
        .then(function (result) {
            return res.status(200).json(new ApiResponse(
                200,
                { result },
                "Video Comment fetched successfully"
            ))
        })
        .catch(function (error) {
            throw error
        })
})


export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}
