import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const skip=(Number(page)-1)*limit;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID format");
    }   
    const allComments=await Comment.find(
        {
            video:videoId
        }
    )
    .sort({createdAt:-1})
    .skip(skip)
    .limit(Number(limit))
    .populate("owner","username avatar");
    const totalComments=await Comment.countDocuments({video:videoId});
    const pages=Math.ceil(totalComments/Number(limit));
    res.status(200).json(new ApiResponse(200,
        {comments:allComments,
        totalComments:totalComments,
        totalpages:pages,
        hasNextPage:page<pages,
        hasPrevPage:page>1
    },"comments retrieved successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId}=req.params;
    const {content}=req.query;
    // TODO: add a comment to a video
    const comment=await Comment.create(
        {
            content:content,
            video:videoId,
            owner:req.user._id
        }
    )
     res.status(200).json(new ApiResponse(200,comment,"added comment to video successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}=req.params;
    const {content}=req.query;
    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:content
            }
        },
        {
            new:true
        }
    )
     res.status(200).json(new ApiResponse(200,updatedComment,"updated comment successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}=req.params;
    const deletedComment=await Comment.findByIdAndDelete(commentId);
    res.status(200).json(new ApiResponse(200,deletedComment,"deleted comment successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
