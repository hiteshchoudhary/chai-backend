import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    if(!videoId){
        res.status(400).json({
            message: "id is incorrect"
        })
    }
    const {page = 1, limit = 10} = req.query
    const comments  = await Comment.find({
        video: videoId
    })
    if(!comments){
        res.status(500).json({
            message: "comments not found "
        })
    }
    res.json({
        message:"comments for this video",
        comments: comments
    })
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const{content,videoId,userId}= req.body
    if(!content || !videoId || !userId ){
        res.status(400).json({
            message: " incorrect inputs"
        })
    }
    const comment = await Comment.create({
        content: content,
        video: videoId,
        owner: userId
    })
    res.json({
        message: "comment added ",
        comment: comment
    })
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {ownerId,commentId,newComment} = req.body
    if(!ownerId || !commentId || !newComment ){
        res.status(400).json({
            message: " incorrect inputs"
        })
    }
    const comment = await Comment.updateOne({
        owner: ownerId,
        _id: commentId
    },{
        content: newComment
    })
    res.json({
        message: "comment updated",
        comment: comment
    })
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {ownerId,commentId} = req.body
    if(!ownerId || !commentId ){
        res.status(400).json({
            message: " incorrect inputs"
        })
    }
    const comment = await Comment.deleteOne({
        owner: ownerId,
        _id: commentId
    })
    res.json({
        message: "comment deleted",
        comment: comment
    })

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
