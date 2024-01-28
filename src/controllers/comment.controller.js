import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!videoId){
        throw new ApiError(400,"videoId is required!!");
    }
    const video = await Video.findById(videoId);
    if(!video){
         // If the video doesn't exist, delete all comments associated with the video ID
         await Comment.deleteMany({ video: videoId });
         throw new ApiError(400, "There is no such Video. All associated comments have been deleted.");
    }
    const commentsAggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes",
            },
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes",
                },
                owner: {
                    $first: "$owner",
                },
                isLiked: {
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            },
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                likesCount: 1,
                owner: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                },
                isLiked: 1
            },
        },
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    );

    if(!comments || comments.length === 0){
        return res
        .status(200)
        .json(new ApiResponse(200,{},"No commments in this video!!"))
    }
    return res
    .status(200)
    .json(new ApiResponse(200,comments,"Comments of the video fetched Successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {commentContent} = req.body
    if(!videoId){
        throw new ApiError(400,"videoId is required!!")
    }
   try {
     const video = await Video.findById(videoId)
     if(!video || ( video.owner.toString() !== req.user?._id.toString() && !video.isPublished)){
         throw new ApiError(400,"There is no such Video")
     }
     if(!commentContent){
         throw new ApiError(400,"commentContent is required!!")
     }
     const comment = await Comment.create({
         content : commentContent,
         video:videoId,
         owner:req.user?._id
     })
     if(!comment){
         throw new ApiError(500,"Unable to create comment");
     }
     return res
     .status(200)
     .json(new ApiResponse(200,comment,"comment posted successfully"))
   } catch (e) {
    throw new ApiError(500,e?.message || "Unable to create comment")
   }


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {commentContent} = req.body
    if(!commentId){
        throw new ApiError(400,"commentId is Required!!");
    }
    try {
        const comment = await Comment.findById(commentId);
        if(!comment ){
            throw new ApiError(404,"comment not found");
        }
        //video is published or not 
        const videoId = new mongoose.Types.ObjectId(comment.video)
        const video = await Video.findById(videoId)
        if(!video){//if video doesnt exists then comment should be deleted
           await Comment.deleteMany({ video: videoId });//assume it is successfull
           return res
           .status(404)
           .json(new ApiResponse(404,{},"Comment doesn't exist"))
        }
        if( video.owner.toString() !== req.user?._id.toString() && !video.isPublished){
            throw new ApiError(300,"Video doesn't exists")
        }
        if(comment.owner.toString() !== req.user?._id.toString() ){
            throw new ApiError(300,"Unauthorized Access")
        }
        if(!commentContent){
            throw new ApiError(400,"commentContent is required!!")
        }
        const UpdatedComment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set:{
                    content:commentContent
                }
            },
            {
                new:true
            }
        )
        if(!UpdatedComment){
            throw new ApiError(500,"Unable to update the comment")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200,UpdatedComment,"Comment Updated Successfully"))
    } catch (e) {
        throw new ApiError(500,e?.message || "Unable to updfate the comment")
    }
    
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;
    
    if(!commentId){
        throw new ApiError(400,"commentId is Required!!");
    }
    try {
        const comment = await Comment.findById(commentId);
        if(!comment){
            throw new ApiError(404,"comment not found");
        }
        //video is published or not 
        const videoId = new mongoose.Types.ObjectId(comment.video)
        const video = await Video.findById(videoId)
        if(!video){  // If the video doesn't exist, delete all comments associated with the video ID
         await Comment.deleteMany({ video: videoId });
         throw new ApiError(400, "There is no such Video. All associated comments have been deleted.");
        }
        if( video.owner.toString() !== req.user?._id.toString() && !video.isPublished){
            throw new ApiError(300,"Video doesn't exists")
        }
        if(comment.owner.toString() !== req.user?._id.toString() ){
            throw new ApiError(300,"Unauthorized Access")
        }
        const DeletedComment = await Comment.findByIdAndDelete(commentId)
        if(!DeletedComment){
            throw new ApiError(500,"Unable to delete the comment")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200,{},"Comment deleted Successfully"))
    } catch (e) {
        throw new ApiError(500,e?.message || "Unable to delete the comment")
    }
    
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
