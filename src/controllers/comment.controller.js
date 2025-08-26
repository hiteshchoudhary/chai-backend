import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID...");
    }
    const comment = Comment.aggregate([
        {
            $match: {
                videoId: new mongoose.Types.ObjectId(videoId) 
            }
        },
        {
            $sort: { createdAt: -1 },
        },
    ]);

    const paginate = await Comment.aggregatePaginate(comment, {
        page: parseInt(page),
        limit: parseInt(limit),
    });

    return res.status(200).json(200, "Comments fetched successfully", paginate);
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const content = req.body
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if (!content) {
        throw new ApiError(200, "All fields are required...");
    }

    const newComment = await Comment.create({
        content : content,
        video : videoId,
        owner : req.user._id
    })

    if (!newComment) {
        throw new ApiError(400, "failed to create comment");
    }

    return res
    .status(201)
    .json(new ApiResponse(201, "comment created successfully", newComment));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const content = req.body;
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment id...");
    }
    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
        throw new ApiError(404, "Invalid comment id...");
    }
    if (existingComment.owner.toString() !== req.user.id.toString()) {
        throw new ApiError(
        403,
        "you are not authorized to update the comment of other users"
        );
    }
    const newComment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true }
    );
    if (!newComment) {
        throw new ApiError(404, "failed to update comment...");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "comment updated successfully", newComment));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment id...");
    }
    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
        throw new ApiError(404, "Invalid comment id...");
    }
    if (existingComment.owner.toString() !== req.user.id.toString()) {
        throw new ApiError(
        403,
        "you are not authorized to delete the comment of other users"
        );
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);
    if (!deletedComment) {
        throw new ApiError(400, "comment deleted unscessfully");
    }
     return res
        .status(200)
        .json(new ApiResponse(200, "comment deleted successfully", {}));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }