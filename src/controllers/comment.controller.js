import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    console.log(videoId)

    if(!videoId?.trim()){
        throw new ApiError(400, "Video id is required")
    }
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const comments = await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        }

    ])
    console.log(comments)

    if(!comments || comments.length === 0){
        throw new ApiError(404, "Comments not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"))  


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    if(!videoId?.trim()){
        throw new ApiError(400, "Video id is required")
    }

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const {content} = req.body
    if(!content?.trim()){
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.create({
        content:content,
        video:videoId,
        owner:req.user._id
    })
    if(!comment){
        throw new ApiError(500, "Failed to create comment")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment created successfully"))
    
    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    if(!commentId?.trim()){
        throw new ApiError(400, "Comment id is required")
    }

    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const {content} = req.body
    if(!content?.trim()){
        throw new ApiError(400, "Content is required")
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            content:content
        },
        {
            new:true,
            runValidators:true
        }
    )
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    if(!commentId?.trim()){
        throw new ApiError(400, "Comment id is required")
    }
    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findByIdAndDelete(commentId)
    if(!comment){
        throw new ApiError(404, "Comment not found")
    }   

    return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment deleted successfully"))

    
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
