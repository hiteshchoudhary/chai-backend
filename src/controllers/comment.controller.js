import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    // aggregate pipeline will be used

    
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    try {
        const { content,video,owner } = req.body;

        const comment = await Tweet.create({
            content,
            video,
            owner,
        });

        res.status(201).json(
            new ApiResponse(200, "Comment added to the video:", comment)
        );
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    try{
        const {commentId,updatedContent} = req.body

        const comment = await Comment.findById(commentId)
        
        // Check if the comment exists
        if (!tweet) { 
            throw new ApiError(404, "Comment not found")
        }
    
        comment.content = updatedContent
        await comment.save({validateBeforeSave: false})
    
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment updated successfully"))
    }
    catch (error) {
        console.error("Error updating tweet:", error);
        return res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    try {
        const { commentId } = req.body;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);

        // Check if the comment exists
        if (!comment) {
            throw new ApiError(404, "comment not found")
        }

        // Check if the authenticated user is the owner of the comment
        if (comment.owner.toString() !== userId) {
            return res.status(403).json(
                new ApiResponse(403, "Unauthorized: You are not the owner of this comment")
            );
        }

        // Delete the comment
        await comment.remove();
 
        return res.status(200).json(
            new ApiResponse(200, {}, "comment deleted successfully")
        );
    } catch (error) {
        console.error("Error deleting comment:", error);
        return res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
