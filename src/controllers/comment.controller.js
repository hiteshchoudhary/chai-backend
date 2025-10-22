import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query;

    /* 
        1. Take the Video id and extract the Video Schema.
        2. Now Take the Video id and search in the comment schema.
        3. Extract all the comments present with the video Id.
        4. Take over the username & avatar.
        5. Use aggregation pipeline + use pagination.

    */
    const options = {
        page,
        limit
    }

    if (!videoId) {
        throw new ApiError(400, "VideoId is invalid");
    }

    // const comments = await Comment.find({ video: videoId }).populate("owner", "username avatar");

    const myAggregateComments = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        }, {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "commentor"
            }
        }, {
            $unwind: "$commentor" // This ensure, each time seperate commentor object is formed.
        }, {
            $project: {
                _id: 1,
                content: 1,
                "commentor._id": 1,
                "commentor.username": 1,
                "commentor.avatar": 1,
                "commentor.fullName": 1,
                "commentor.createdAt": 1,
            }
        }
    ]);

    if (!myAggregateComments) {
        throw new ApiError(400, "Invalid comment fetching.")
    }

    Comment.aggregatePaginate(myAggregateComments, options, function (err, results) {
        if (err) {
            console.error(err);
            throw new ApiError(400, "Invalid comment fetching in aggregation pipeline.")
        } else {
            return res
                .status(200)
                .json(
                    new ApiResponse(200, results, "Got Video all comments successfully.")
                )
        }
    })

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    /* 
        1. take the content from the user, req.body.
        2. Check the existence of it.
        3. Then, get the video id from the params.
        4. get the user id from the req.user (token)
        5. Then, store & save them in the comments db.
    */
    const { content } = req.body;
    const videoId = req.params.videoId;
    const userId = req.user._id;

    if (!content) {
        throw new ApiError(400, "Content is invalid");
    }
    if (!videoId) {
        throw new ApiError(400, "Video Id doesn't exist")
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    });
    await comment.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment created successfully")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    /* 
        1. Get the commentId from the params.
        2. get and update the comment schema.
        3. then, send the response.
    */

    const { commentId } = req.params;
    const { updatedContent } = req.body;

    if (!updatedContent) {
        throw new ApiError(400, "Content is invalid")
    }

    if (!commentId) {
        throw new ApiError(400, "Comment Id is invalid.");
    }

    const updateComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: updatedContent,
            }
        },
        {
            new: true
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updateComment, "Comment updated successfully")
        )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const { commentId } = req.params;
    if (!commentId) {
        throw new ApiError(400, "Comment Id is invalid.")
    }

    const comment = await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "Comment deleted successfully.")
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
