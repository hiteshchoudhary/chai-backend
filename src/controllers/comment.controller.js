import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!videoId){
        throw new ApiError(400, "Video is Required");
    }

    // Ensure numeric values
    page = parseInt(page);
    limit = parseInt(limit);

    const options ={
        page,
        limit,
    }

    const aggregateOptions = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            fullname: 1,
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: "$likes"
                },
                owner: {
                    $first : "$owner"
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "@likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        }
    ];
    
    const comments = await Comment.aggregatePaginate(aggregateOptions,options);

    if(!comments.length){
        throw new ApiError(500,"Comments not found");
    }

    return res 
        .status(200)
        .json(
            new ApiResponse(200,comments,"Comments fetched successfully")
        )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
     const { videoId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if(!videoId || !content){
        throw new ApiError(400, "Video Id and comment content are required");
    }

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    const createdComment = await Comment.findById(newComment._id)

    if (!createdComment) {
        throw new ApiError(500,"Something want wrong while saving comment");
    }

    return res 
        .status(200)
        .json(
            new ApiResponse(200,newComment,"Comment added successfully")
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if(!commentId || !content){
        throw new ApiError(400, "Comment Id and Comment Content are required");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    if(comment.owner.tostring() !== userId.tostring()){
        throw new ApiError(403, "Unauthorized to change this comment");
    }

    comment.content = comment;
    await comment.save({validateBeforeSave:false});

    return res 
        .status(200)
        .json(
            new ApiResponse(200,comment,"Comment updated successfully")
        );
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    const userId = req.user?._id;

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "Comment not found");
    }

    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to delete this comment");
    }

    // First delete likes linked to this comment
    await Like.deleteMany({comment: commentId});
    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Comment deletes successfully")
        );
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
