import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"videoId is required")
    }
   try {
     const video = await Video.findById(videoId);
     if(!video || ( video.owner.toString() !== req.user?._id.toString() && !video.isPublished) ){
         throw new ApiError(404,"Video Not found")
     }
     const likecriteria = {video:videoId,likedBy:req.user?._id};
     const alreadyLiked = await Like.findOne(likecriteria);
     if(!alreadyLiked){//create new like
         const newLike = await Like.create(likecriteria)
         if(!newLike){
             throw new ApiError(500,"Unable to like the video")
         }  
         return res
         .status(200)
         .json(new ApiResponse(200,newLike,"Successfully like the video"))
     }
     //already liked
     const dislike = await Like.deleteOne(likecriteria);
     if(!dislike){
         throw new ApiError(500,"Unable to dislike the video")
     }  
     return res
     .status(200)
     .json(new ApiResponse(200,{},"Successfully dislike the video"))
   } catch (e) {
    throw new ApiError(500,e?.message || "Unable to toggle the like of the video")
   }


})
//TODO:-if video is not published
const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!commentId){
        throw new ApiError(400,"commentId is required")
    }
   try {
     const comment = await Comment.findById(commentId);
     if(!comment){
         throw new ApiError(404,"comment Not found")
     }
     const likecriteria = {comment:commentId,likedBy:req.user?._id};
     const alreadyLiked = await Like.findOne(likecriteria);
     if(!alreadyLiked){//create new like
         const newLike = await Like.create(likecriteria)
         if(!newLike){
             throw new ApiError(500,"Unable to like the comment")
         }  
         return res
         .status(200)
         .json(new ApiResponse(200,newLike,"Successfully like the comment"))
     }
     //already liked
     const dislike = await Like.deleteOne(likecriteria);
     if(!dislike){
         throw new ApiError(500,"Unable to dislike the comment")
     }  
     return res
     .status(200)
     .json(new ApiResponse(200,{},"Successfully dislike the comment"))
   } catch (e) {
    throw new ApiError(500,e?.message || "Unable to toggle the like of the comment")
   }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId){
        throw new ApiError(400,"tweetId is required")
    }
   try {
     const tweet = await Tweet.findById(tweetId);
     if(!tweet){
         throw new ApiError(404,"tweet Not found")
     }
     const likecriteria = {tweet:tweetId,likedBy:req.user?._id};
     const alreadyLiked = await Like.findOne(likecriteria);
     if(!alreadyLiked){//create new like
         const newLike = await Like.create(likecriteria)
         if(!newLike){
             throw new ApiError(500,"Unable to like the tweet")
         }  
         return res
         .status(200)
         .json(new ApiResponse(200,newLike,"Successfully like the tweet"))
     }
     //already liked
     const dislike = await Like.deleteOne(likecriteria);
     if(!dislike){
         throw new ApiError(500,"Unable to dislike the tweet")
     }  
     return res
     .status(200)
     .json(new ApiResponse(200,{},"Successfully dislike the tweet"))
   } catch (e) {
    throw new ApiError(500,e?.message || "Unable to toggle the like of the tweet")
   }

})


const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;
    try {
        const likedVideos = await Like.aggregate([
            {
                $match: {
                    likedBy: new mongoose.Types.ObjectId(userId),
                }
            },
            {
                $lookup: {
                    from: "videos",
                    localField: "video",
                    foreignField: "_id",
                    as: "likedVideos"
                }
            },
            {
                $unwind: "$likedVideos"
            },
            {
               $match:{
                   "likedVideos.isPublished" : true
               }
            },
            {
                $lookup: {
                    from: "users",
                    let: { owner_id: "$likedVideos.owner" },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ["$_id", "$$owner_id"] }
                            }
                        },
                        {
                            $project: {
                                _id: 0,
                                username: 1,
                                avatar: 1,
                                fullName: 1
                            }
                        }
                    ],
                    as: "owner"
                }
            },
            {
                $unwind: { path: "$owner", preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: "$likedVideos._id",
                    title: "$likedVideos.title",
                    thumbnail: "$likedVideos.thumbnail",
                    owner: {
                        username: "$owner.username",
                        avatar: "$owner.avatar",
                        fullName: "$owner.fullName"
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    likedVideos: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    likedVideos: 1
                }
            }
        ]);
        
        if (likedVideos.length === 0) {
            return res
                .status(404)
                .json(new ApiResponse(404, [], "No liked videos found"));
        }
        
        return res
        .status(200)
        .json(new ApiResponse(200,likedVideos,"LikedVideos fetched Successfully!"))
    
    
    } catch (e) {
        throw new ApiError(500,e?.message || "Unable to fecth LikedVideos!")
        
    }


})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}