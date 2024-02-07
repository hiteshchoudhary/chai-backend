import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Like} from "../models/like.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
   
    const { videoId } = req.params;
  let { page = 1, limit = 10 } = req.query;

  page = isNaN(page) ? 1 : Number(page);
  limit = isNaN(page) ? 10 : Number(limit);

  if (!videoId?.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "video id is required or valid");
  }

  //because skip and limit value in aggearagation must be greater than zero
  if(page <= 0){
    page = 1
  }if(limit<=0){
    limit = 10
  }

  const comments = await Comment.aggregate([
    {
     '$match': {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      '$lookup': {
        'from': 'users', 
        'localField': 'owner', 
        'foreignField': '_id', 
        'as': 'owner', 
        'pipeline': [
          {
            '$project': {
              'username': 1, 
              'fullname': 1, 
              'avatar': 1
            }
          }
        ]
      }
    },
    {
      '$lookup': {
        'from': 'likes', 
        'localField': '_id', 
        'foreignField': 'comment', 
        'as': 'likeCount'
      }
    },
    {
      '$addFields': {
        'likeCount': {
          '$size': '$likeCount'
        }
      }
    }, {
      '$addFields': {
        'owner': {
          '$first': '$owner'
        }
      }
    },
    {
      '$skip': (page-1)*limit
    },
    {
      '$limit': page ,
    },
  ]);

  if (comments.length == 0) {
    throw new ApiError(500, "commets not found!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "comments fetched successfully!"));

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body;
    const { videoId } = req.params;
    if (!content) {
      throw new ApiError(400, "content is required to comment!");
    }
  
    if(!videoId.trim() || !isValidObjectId(videoId)){
        throw new ApiError(400,"video id is required or invalid!")
    }
  
    const video = await Video.findById(videoId)
    if(!video){
      throw new ApiError(404,"video not found to comment!");
    }
    
   
  
    const newComment = await Comment.create({
      content,
      video: new mongoose.Types.ObjectId(videoId),
      owner: req.user?._id,
    });
  
    if (!newComment) {
      throw new ApiError(500, "Error while creating comment!");
    }
    return res
      .status(201)
      .json(new ApiResponse(201, newComment, "comment added to video!"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { content } = req.body;
    const { commentId } = req.params;
    if (!content) {
      throw new ApiError(400, "content required!");
    }
    if(!commentId.trim() || !isValidObjectId(commentId)){
      throw new ApiError(400,"comment id is required or invalid!")
    }
  
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }
    if (comment.owner.toString() != (req.user?._id).toString()) {
      throw new ApiError(401, "Unauthorised user!");
    }
  
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      {
        $set: {
          content,
        },
      },
      {
        new: true,
      }
    );
  
    if (!updatedComment) {
      throw new ApiError(500, "error while updating comments!");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedComment, "comment updated successfully!")
      );
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if(!commentId.trim() || !isValidObjectId(commentId)){
      throw new ApiError(400,"comment id is required or invalid!")
    }
  
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }
    if (comment.owner.toString() != (req.user?._id).toString()) {
      throw new ApiError(401, "Unauthorised user!");
    }
    const deletedComment = await Comment.findByIdAndDelete(commentId);
  
    const likeDelete = await Like.deleteMany({comment: new mongoose.Types.ObjectId(commentId)});

    if (!deletedComment) {
      throw new ApiError(500, "Error while deleting comment!");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "comment deleted successfully!"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
