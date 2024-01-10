import mongoose, { isValidObjectId } from "mongoose";
import {Comment} from "../models/comment.model.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    if(!videoId?.trim() || !isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is required or invalid");
    }
    let {page = 1, limit = 10} = req.query;
    page = isNaN(page) ? 1 : Number(page);
    limit = isNaN(limit) ? 10 : Number(limit);
    if(page <= 0){
        page = 1;
    }
    if(limit <= 0){
        page = 10;
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: "commentedBy",
                foreignField: "_id",
                as: "commentedBy",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                commentedBy: {
                    $first: "$commentedBy"
                }
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ]);

    res.status(200).json(new ApiResponse(
        200,
        comments,
        "Get video comments success"
    ));
});

const addCommentToVideo = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    if(!videoId?.trim() || !isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is required or invalid")
    }

    const content = req.body?.content?.trim();
    if(!content){
        throw new ApiError(400, "Comment text is required");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found to comment");
    }

    const comment = await Comment.create({
        content,
        video: video._id,
        commentedBy: req.user?._id
    });

    if(!comment){
        throw new ApiError(500, "Something went wrong while posting comment");
    }

    res.status(201).json(new ApiResponse(
        201,
        comment,
        "Add comment to video success"
    ));
});

const getTweetComments = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if(!tweetId?.trim() || !isValidObjectId(tweetId)){
        throw new ApiError(400, "tweetId is required or invalid");
    }
    let {page = 1, limit = 10} = req.query;
    page = isNaN(page) ? 1 : Number(page);
    limit = isNaN(limit) ? 10 : Number(limit);

    if(page <= 0){
        page = 1;
    }
    if(limit <= 0){
        page = 10;
    }

    const comments = await Comment.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: "commentedBy",
                foreignField: "_id",
                as: "commentedBy",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                commentedBy: {
                    $first: "$commentedBy"
                }
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: limit
        }
    ]);

    res.status(200).json(new ApiResponse(
        200,
        comments,
        "Get tweet comments success"
    ));
});

const addCommentToTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if(!tweetId?.trim() || !isValidObjectId(tweetId)){
        throw new ApiError(400, "tweetId is required or invalid")
    }

    const content = req.body?.content?.trim();
    if(!content){
        throw new ApiError(400, "Comment text is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404, "Tweet not found to comment");
    }

    const comment = await Comment.create({
        content,
        tweet: tweet._id,
        commentedBy: req.user?._id
    });

    if(!comment){
        throw new ApiError(500, "Something went wrong while posting comment");
    }

    res.status(201).json(new ApiResponse(
        201,
        comment,
        "Add comment to tweet success"
    ));
});

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    if(!commentId?.trim() || !isValidObjectId(commentId)){
        throw new ApiError(400, "commentId is required or invalid");
    }

    const content = req.body?.content?.trim();
    if(!content){
        throw new ApiError(400, "Comment text is required to update comment");
    }

    const comment = await Comment.findByIdAndUpdate(commentId, {
        $set: {
            content
        }
    }, {new : true});
    if(!comment){
        throw new ApiError(500, "Something went wrong while updating comment");
    }

    res.status(200).json(new ApiResponse(
        200,
        comment,
        "Comment update success"
    ));
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    if(!commentId?.trim() || !isValidObjectId(commentId)){
        throw new ApiError(400, "commentId is required or invalid");
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(404, "comment not found");
    }

    if(comment.commentedBy?.toString() !== req.user?._id?.toString()){
        throw new ApiError(401, "You cannot delete this comment");
    }

    await Comment.findByIdAndDelete(comment._id); //test this properly

    res.status(200).json(new ApiResponse(
        200,
        {},
        "Comment delete success"
    ));
});

export {
    getVideoComments, 
    addCommentToVideo, 
    getTweetComments,
    addCommentToTweet,
    updateComment,
    deleteComment
}