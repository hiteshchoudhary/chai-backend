import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  try {
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Video Id not valid");
    }

    const video = await Video.findById(videoId);

    if (!video || !video.isPublished) {
      throw new ApiError(404, "Video not found or not published");
    }

    const userAlreadyLiked = await Like.findOne({
      video: videoId,
      likedBy: req.user?._id,
    });

    if (userAlreadyLiked) {
      userAlreadyLiked.remove();
      res.status(200).json(new ApiResponse(200, "Like removed successfully"));
    }

    const likeVideo = await Like.create({
      video: videoId,
      likedBy: req.user?._id,
    });

    if (!likeVideo) {
      throw new ApiError(400, "Video is unabled to like");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          likeVideo,
          likeVideo,
          "Successfully liked the video"
        )
      );
  } catch (error) {
    throw new ApiError(
      400,
      "Video is unabled to like, something went wrong",
      error
    );
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;
    //TODO: toggle like on comment

    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "comment id is not valid");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(400, "comment not founded");
    }

    const alreadyLiked = await Like.findOne({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (alreadyLiked) {
      await alreadyLiked.remove();
      res.json(200).json(new ApiResponse(200, "Successfully removed like"));
    }

    const likeComment = await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });

    if (!likeComment) {
      throw new ApiError(400, "Something went wrong, Comment not liked");
    }

    res.json(200, likeComment, "Successfully liked the comment");
  } catch (error) {
    throw new ApiError(400, "Something went wrong", error);
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  //TODO: toggle like on tweet
  try {
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
      throw new ApiError(400, "tweet id is not valid");
    }

    const tweet = await Comment.findById(tweetId);

    if (!tweet) {
      throw new ApiError(400, "tweet not founded");
    }

    const alreadyLiked = await Like.findOne({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    if (alreadyLiked) {
      await alreadyLiked.remove();
      res.json(200).json(new ApiResponse(200, "Successfully removed like"));
    }

    const liketweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });

    if (!liketweet) {
      throw new ApiError(400, "Something went wrong, tweet not liked");
    }

    res.json(200, liketweet, "Successfully liked the tweet");
  } catch (error) {
    throw new ApiError(400, "Something went wrong", error);
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const aggregate = [
    {
        $match: {
            likedBy: req.user?._id
        },
        $lookup: {
            from: "Video",
            localField: "video",
            foreignField: "_id",
            as: "likedVideos"
        },
        $unwind: {
            path: "$likedVideos",
            includeArrayIndex: 0
        },
        $project: {
            likedVideo: 1
        }
    }
  ]

  const likedVideo = await Like.aggregate(aggregate)

  if(!likedVideo){
    throw new ApiError(400, "Liked Video not founded")
  }
  
  res.status(200).json(
    new ApiResponse(200, likedVideo, "Successfully got the like video list")
  )

});

const getTotalLikeOfVideo = asyncHandler(async (req, res) => {
    //TODO: get total like of a videos
    try {
      const { videoId } = req.params;
  
      if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "video id is not valid");
      }
  
      const video = await Video.findById(videoId);
  
      if (!video) {
        throw new ApiError(404, "Video not found ");
      }
  
      const aggregate = [
        {
          $match: {
            video: videoId,
          },
        },
        {
          $group: {
            _id: null,
            totalLikes: { $sum: 1 },
          },
        },
      ];
  
      const likes = await Like.aggregate(aggregate);
  
      if (!likes) {
        throw new ApiError(400, "Like list not founded");
      }
  
      res
        .status(200)
        .json(new ApiResponse(200, likes, "Successfully got the like list"));
    } catch (error) {
      throw new ApiError(400, "something went wrong", error);
    }
  });
export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos, getTotalLikeOfVideo };
