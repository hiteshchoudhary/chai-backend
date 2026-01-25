import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { ApiError } from "../utils/ApiError.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"

    
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    if(!mongoose.isValidObjectId(videoId) || !videoId){
        throw new ApiError(400, "Invalid video id")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }

    
     const comments =  Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline: [
                    {
                        $lookup: {                      //to pass in full owner details while connecting the video
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline: [
                                {
                                    $project: {              //Can't pass Sensitive info
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                                        ownerDetails: { $first: "$ownerDetails" } //We put this here becuase of scope issues. The `owneerDetails` field belongs to the `Video` model not the `User` model , thus it can't be accessible there.
                        } 
                    }
                ],
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "watchHistory",
                            foreignField: "_id",
                            as: "watchHistoryDetails",
                        }
                    },
                    {
                        $addFields: {
                            watchHistoryDetails: { $first: "$watchHistoryDetails" }
                        }
                    }
                ]
            }
        },            
    ])

    const {page = 1, limit = 10} = req.query
    
    const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
    }

    const result = await Comment.aggregatePaginate(comments, options)

   if(!result ){
    throw new ApiError(404, "Error while fetching comments")
   }

   return res.status(200).json(new ApiResponse(200,result,"Comments fetched successfully"))


    

})

const addComment = asyncHandler(async (req, res) => {

    const { videoId }= req.params;
    const { content } = req.body;

    if(content.trim()==""){
        throw new ApiError("400", "Comment cannot be empty");
    }

    if( !(await Video.findById(videoId))){
        throw new ApiError(404, "Video not found");
    }

    const user = await User.findById(req.user?._id);  //Since the verifyJWT already checks if the user checks exists or not. This check is redundant

    if(!user){
        throw new ApiError(400,"User dosen't exist")
    }

    const comment = await Comment.create({
        content:content,
        video: videoId,
        owner: req.user?._id
    })

    if(!comment){
        throw new ApiError(500, "Error while adding comment, Please try again");
    }

    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));

})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId, videoId} = req.params;
    const {newContent} = req.body;

    if(!mongoose.isValidObjectId(commentId) || !commentId){ // this commentId check is redudant as, if the comment doesn't exist, the endpoint won't be hit at all 
        throw new ApiError(400, "Invalid comment id")
    }

    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"Comment dosen't exists.")
    }

    if(!(await Video.findById(videoId) ) ){
        throw new ApiError(404,"Video dosen't exists, Sorry")
    }

    //we also need to check if the comment being updated was writtend by the same user or not- else any user can update any comment
    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to update this comment")
    }

    //don't need to check if user exists or not ;as it is done by the middleware

    const Updatedcomment = await Comment.findByIdAndUpdate(commentId, {
        content: newContent
    },{new :true})

    if(!Updatedcomment){
        throw new ApiError(500, "Error while updating comment, Please try again")
    }

    return res.status(200).json(new ApiResponse(200, Updatedcomment , "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {p
    const {commentId} = req.params;
    

    if(!mongoose.isValidObjectId(commentId) || !commentId){
        throw new ApiError(400, "Invalid comment id")
    }
    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404, "Comment not found")
    }

    if(comment?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this comment")
    }
    
    const deletedComment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user?._id
    })

    if(!deletedComment){
        throw new ApiError(500, "Error while deleting comment, Please try again")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, null, "Comment deleted successfully"))
})

export {
    getVideoComments,   
    addComment, 
    updateComment,
    deleteComment
    }
