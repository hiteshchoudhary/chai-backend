import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    
    //TODO: toggle like on video
    const { videoId } = req.params;
    if (!videoId.trim() || !isValidObjectId(videoId)) {
      throw new ApiError(400, "video id is invalid or required!");
    }
    const video = await Video.findById(videoId);
  
    if (!video) {
      throw new ApiError(404, "Video not found!");
    }
  
    const isLikedAllRedy = await Like.find({
      video: videoId,
      likedBy: req.user?._id,
    });
  
    if (isLikedAllRedy.length == 0) {
      const likeDoc = await Like.create({
        video: videoId,
        likedBy: req.user?._id,
      });
      return res.status(200).json(new ApiResponse(200, {}, "liked video!"));
    } else {
      const deleteDoc = await Like.findByIdAndDelete(isLikedAllRedy[0]._id);
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "remove liked from video!"));
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    
    //TODO: toggle like on comment
    const { commentId } = req.params;
    if (!commentId.trim() || !isValidObjectId(commentId)) {
      throw new ApiError(400, "comment id is invalid or required!");
    }
  
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found!");
    }
  
    const isLikedAllRedy = await Like.find({
      comment: commentId,
      likedBy: req.user?._id,
    });
  
    if (isLikedAllRedy.length == 0) {
      const likeDoc = await Like.create({
        comment: commentId,
        likedBy: req.user?._id,
      });
      return res.status(200).json(new ApiResponse(200, {}, "liked comment!"));
    } else {
      const deleteDoc = await Like.findByIdAndDelete(isLikedAllRedy[0]._id);
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "remove liked from comment!"));
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
   
    //TODO: toggle like on tweet
    const { tweetId } = req.params;
  if (!tweetId.trim() || isValidObjectId(tweetId)) { 
    throw new ApiError(400, "tweet id is required or invalid");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "tweet not found!");
  }

  const isLikedAllRedy = await Like.find({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  if (isLikedAllRedy.length == 0) {
    const likeDoc = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });
    return res.status(200).json(new ApiResponse(200, {}, "liked tweet!"));
  } else {
    const deleteDoc = await Like.findByIdAndDelete(isLikedAllRedy[0]._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "remove liked from tweet!"));
  }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = new mongoose.Types.ObjectId(req.user?._id);
    [
      {
        '$match': {
          'video': {
            '$exists': true
          }
        }
      }, {
        '$lookup': {
          'from': 'videos', 
          'localField': 'video', 
          'foreignField': '_id', 
          'as': 'video', 
          'pipeline': [
            {
              '$project': {
                'videoFile': 1, 
                'thumbnail': 1, 
                'title': 1, 
                'description': 1, 
                'views': 1, 
                'duration': 1
              }
            }
          ]
        }
      }, {
        '$addFields': {
          'video': {
            '$first': '$video'
          }
        }
      }
    ]
    const pipline = [
      {
        $match: {
          video: {
            $exists: true,
          },
          likedBy: userId,
        },
        
      },
      {
        $lookup: {
          from: "videos",
          localField: "video",
          foreignField: "_id",
          as: "video",
          pipeline:[
            {
              $project:{
                videoFile:1,
                thumbnail:1,
                views:1,
                duration:1,
                title:1,
                description:1,
              }
            }
          ]
        },
      },
      {
        $addFields: {
          video: {
            $first: "$video",
          },
        },
      },
      {
        $project: {
          video: 1,
        },
      },
    ];
  
    const videoes = await Like.aggregate(pipline);
  
    if (videoes.length == 0) {
      throw new ApiError(404, "No Liked videos !");
    }
    res.status(200).json(new ApiResponse(200, {videoes,videosCount: videoes.length}, "liked videoes!"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}