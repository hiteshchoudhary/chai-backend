import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    if (!videoId) throw new ApiError(404, "Id not found");
    const { page = 1, limit = 10 } = req.query
    const parsedLimit = parseInt(limit);
    const pageSkip = (page - 1) * parsedLimit;

    const allComments = await Comment.aggregate([
        {
            $match : {
                video : videoId,
            }

        },
        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline: [
                    
                    {
                        $project: {
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $skip: pageSkip,
        },
        {
            $limit: parsedLimit,
        },

    ])

    if (!allComments) throw new ApiError(504, "not created");

    res.status(200).json(new ApiResponse(200, allComments, "commented successfully"));


})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    if (!videoId || !content) throw new ApiError(404, "Id or content not found");

    const comment = await Comment.create({
        content,
        owner: req.user,
        video: videoId,
    })

    if (!comment) throw new ApiError(504, "not created");

    res.status(200).json(new ApiResponse(200, comment, "commented successfully"));


})

const updateComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    if (!videoId || !content) throw new ApiError(404, "Id or content not found");

    const comment = await Comment.findById(videoId);

    // Check if the playlist exists
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user is the owner of the playlist
    if (comment.owner !== req.user) {
        throw new ApiError(403, "You are not allowed");
    }

    comment.content = content

    try {
        await comment.save();
    } catch (error) {
        throw new ApiError(503,` not updated ${error}`);
    }

    res.status(200).json(new ApiResponse(200, comment, "comment update successfully"));

})

const deleteComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) throw new ApiError(404, "Id not found");

    const comment = await Comment.findById(videoId);

    // Check if the playlist exists
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user is the owner of the playlist
    if (comment.owner !== req.user) {
        throw new ApiError(403, "You are not allowed");
    }

    try {
        await comment.remove();
    } catch (error) {
        throw new ApiError(503, `  ${error}`);
    }

    res.status(200).json(new ApiResponse(200, comment, "comment remove successfully"));
})

export {
    addComment, deleteComment, getVideoComments, updateComment
}

