import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId) {
        throw new ApiError(400, "Video ID is required");
    }
    const aggregate = Video.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "commentsOnVideo",
                
            }
        },
        {
            $unwind: "$commentsOnVideo" // flatten comments array
        },

        {
            $replaceRoot: { newRoot: "$commentsOnVideo" } // makes comments top-level
        }   

    ])

    const comments = await Video.aggregatePaginate(aggregate, {page, limit})
    return res.status(200).json(new ApiResponse(200, comments, "fetched video comments success"))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if (!videoId) {
        throw new ApiError(400, "Video ID is required")
    }
    const {content} = req.body
    if (!content) {
        throw new ApiError(400, "Content is required")
    }
    const comment = await Comment.create({
      video: videoId,
      content,
      owner: req.author._id
    });
    return res
      .status(200)
      .json(new ApiResponse(201, comment, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required")
    }
    const {content} = req.body
    if (!content) {
        throw new ApiError(400, "Content is required")
    }
    const commentUpdation = await Comment.findByIdAndUpdate(
      commentId,
      { 
        $set:{
        content: content
        }
      },

      { new: true }
    );
    return res
      .status(200)
      .json(
        new ApiResponse(200, commentUpdation, "Comment updated successfully")
      );
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    if (!commentId) {
        throw new ApiError(400, "Comment ID is required")
    }
    const comment = await Comment.findByIdAndDelete(commentId)
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
