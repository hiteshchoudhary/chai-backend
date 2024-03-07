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
        throw new apiError(400,"videoId is required for getvedios")
    }
    
    const vedioFound =  await Vedio.findById(videoId)
    if(!vedioFound){
        throw new apiError(400,"vedio doesnot exist")
    }

    

   const allCommentFound = await Comment.aggregate([
        {
            $match:{
                vedio:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $addFields:{
                owner:{
                $first:"$owner"}
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likedBy"
            }
        },
        {
            $skip:(page-1)*limit
        },
        {
            $limit:limit
        }
    ])
    if(!allCommentFound || !allCommentFound.length>0){
        throw new apiError(400,"error occured whie finding comments")
    }
    
    return res.status(200).json(
        new apiResponse(
            200,
            allCommentFound,
            "comment found"

        )
    )


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params;
    const {commentData} = req.body;

    if(!videoId){
        throw new apiError(400,"Vedio id is required");
    }

   const vedioFound =  await Vedio.findById(videoId);
   if(!vedioFound){
    throw new apiError(400,"vedio required for commenting doesnot exist")
   }

   if(!commentData){
    throw new apiError(400,"commentData required for commenting doesnot exist")
   }

   const commentCreated = await Comment.create({
    content:commentData,
    vedio:vedioFound?._id,
    owner:req.user?._id
   })

   if(!commentCreated){
    throw new apiError(400,"there is an eroor while creating comment")
   }

   return res.status(200).json(
    new apiResponse(
        200,
        commentCreated,
        "Comment sucessfullly created"
    )
   )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params;
    const {newcomment} = req.body;

    if(!commentId){
    throw new apiError(400,"commentid should be there")
    }

    if(!newcomment){ 
        throw new apiError(400,"new data should be required")
    }

    const commentFound = await Comment.findById(commentId)
    if(!commentFound){
        throw new apiError(400, "existed comment not found")
    }

    if(!(commentFound.owner.toString() === req.user?._id.toString())){
        throw new apiError(400,"cannot update uonly login user can update")
    }

  try {
     const updatedCommment =  await Comment.findByIdAndUpdate(
          commentId,
          {
              $set:{
                  content:newcomment,
              }
          },
          {new:true}
      )
  
      if(!updatedCommment){
          throw new apiError(400,"error found while updating comment")
      }
  
      return res.status(200).json(
          new apiResponse(
              200,
              updateComment,
              "comment updated successfully"
          )
      )
  } catch (error) {
    throw new apiError(401, error?.message)
  }
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params;
    if(!commentId){
        throw new apiError(400,"commentid should be there for deletion")
    }

    const commentFound = await Comment.findById(commentId)
    if(!commentFound){
        throw new apiError(400, "existed comment not found while deletion")
    }
    if(!(commentFound.owner.toString() === req.user?._id.toString())){
        throw new apiError(400,"cannot delete only login user can delete")
    }
try {
    
       const deletion =  await Comment.findByIdAndDelete(
            commentId,
        )
        if(!deletion){
            throw new apiError(400,"Error occured while deletion")
        }
    
        return res.status(200).json(
            new apiResponse(
                200,
                "comment successfully deleted"
            )
        )
} catch (error) {
    throw new apiError(401,"cannot delete" || error?.message)
    
}
    

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
