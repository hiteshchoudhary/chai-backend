import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if (!videoId) {
        throw new ApiError(400,"Video Id is required for get all comments");
    }

    const options ={
        page,
        limit,
    }

    const aggregateOptions = [
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },
        {
            $addFields:{
                totalLikes:{$size:"$likes"},
                isLiked:{
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                },
                owner:{$first:"$owner"}
            }
        }
    ];

    const comments = await Comment.aggregatePaginate(aggregateOptions,options);

    if (!comments) {
        throw new ApiError(500,"something want wrong while get all comments");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,comments,"get all comments successfully")
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {content} = req.body;

    if (!content) {
        throw new ApiError(400,"content is required to create comment");
    }

    if (!videoId) {
        throw new ApiError(400,"Video Id is required to create comment");
    }

    const comment = await Comment.create(
        {
            content:content,
            video:new mongoose.Types.ObjectId(videoId),
            owner:new mongoose.Types.ObjectId(req.user?._id)
        }
    )

    const createdComment = await Comment.findById(comment._id)

    if (!createdComment) {
        throw new ApiError(500,"something want wrong while creating comment");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,createdComment,"comment created successfully")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {content} = req.body;

    if (!content || content.trim()==="" ) {
        throw new ApiError(400, `content is required `);
    }

        if (!commentId) {
        throw new ApiError(400,"Video Id is required for update comments");
    }

    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:content
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,comment,"Tweet updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

        if (!commentId) {
        throw new ApiError(400,"Video Id is required for delete comments");
    }

    const result = await Comment.findByIdAndDelete(commentId);

    return res
    .status(200)
    .json(new ApiResponse(200,{},"comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
