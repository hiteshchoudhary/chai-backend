import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if (!mongoose.Types.ObjectId(videoId){
        throw new ApiError(400,"Video has not been fetched properly")
    const comments=await Comment.aggregate([
        {
            $match:{
                video:mongoose.Type.ObjectId,
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $unwind:$owner
    },
        {
            $project:{
                content:1
                createdAt:1
                "owner._id":1
                "owner.username":1
                "owner.fullname":1
                "owner.avatar":1
            }
        },
        {
            $skip:(Number((page)-1)*Number(limit))
        }
        {
            $limit:Number(limit)
    }  
           
return res
        .status(200)
        .json( new ApiResponse(200, comments,"Comment fetched successfully))
                               })

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const{videoId}=req.params
    const(comment}=req.body
    if (!comment?.trim()){
        throw new ApiError(400, "No comment")
    }
    if (!mongoose.Types.ObjectId.isValid(videoId){
        throw new ApiError (400,"Video not found")
    }
    const createdComment= await Comment.create ({
        content:comment,
        owner:req.user._id,
        video:videoId
    })
        return res
        .status(200)
        .json( new ApiResponse(200, createdComment,"commented Successfully")
    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const{comment_id}=req.params
    const{comment}=req.body

     if (!comment?.trim()){
        throw new ApiError(404, "There is no such comment")
    }
    
    const existedComment=await Comment.findById(comment_id)

    if (!existedComment){
        throw new ApiError(404, "There is no comment")
    }
   
    if (exitedComment.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, "unauthorised")
    }
    const updatedComment =await Comment.findByIdAndUpdate(
        comment_id,{
            $set:{
                content:comment
            }
        },
        {new:true}
        )
    return res
    .status(200)
    .json (new ApiResponse (200, updatedComment, "Comment successfully updated"))
    
})

const deleteComment = asyncHandler(async (req, res) => {
    const {comment_id}=req.params
    if (!mongoose.Types.ObjectId.isValid(comment_id){
        throw new ApiError(400, "Invalid Comment Id")
    }
    const existedComment= await Comment.findById(comment_id)
    if(!exitedComment){
        throw new ApiError(404,"not found")
    }
    if (existedComment.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403, "unauthorised")
    }
    const deletedComment=await Comment.findByIdAndDelete(comment_id)
    return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted")
    
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
