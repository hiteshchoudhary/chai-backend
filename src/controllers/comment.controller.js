import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    try{
        const {videoId} = req.params
        const {page = 1, limit = 10} = req.query
    
        const comments = await Comment.find({videoId}).sort({createdAt:-1})
    
        next(new ApiResponse(200, comments))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId, text} = req.body

    if(!videoId || !text){
        next(new ApiError(400, "Please provide all details"))
    }

    try{
        const newComment = await Comment.create({
            video: videoId,
            content: text,
            owner: req.user._id
        }).save();

        next(new ApiResponse(201, newComment))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId, text} = req.body;

    if(!commentId || !text){
        next(new ApiError(400, "Please provide all details"))
    }

    try{
        const comment = await Comment.findById(commentId);

        if(!comment){
            next(new ApiError(404, "Comment not found"))
        }

        if(comment.owner.toString() !== req.user._id.toString()){
            next(new ApiError(403, "You are not authorized to update this comment"))
        }

        comment.content = text;
        
        const updatedComment = await comment.save();

        next(new ApiResponse(200, updatedComment))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.body;
    if(!commentId){
        next(new ApiError(400, "Please provide comment id"))
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        next(new ApiError(404, "Comment not found"))
    }

    try{
        if(comment.owner.toString() !== req.user._id.toString()){
            next(new ApiError(403, "You are not authorized to delete this comment"))
        }

        await comment.remove();

        next(new ApiResponse(200, "Comment deleted successfully"))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}
