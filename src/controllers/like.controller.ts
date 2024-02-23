import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/ApiError.ts";
import { Like } from "../models/like.models.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { Tweet } from "../models/tweet.models.ts";
import { Comment } from "../models/comment.models.ts";
import { AuthenticatedRequest } from "./user.controller.ts";
import { Request, Response } from "express";

const toggleVideoLike = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
      throw new ApiError(400, "videoId is required or invalid videoId");
    }
    try {
      const video = await Video.findById(videoId);

      if (!video) {
        throw new ApiError(404, "video not found");
      }

      const isLiked = await Like.findOne({
        video: video?._id,
        likedBy: req.user?._id,
      });

      if (!isLiked) {
        const likeDoc = await Like.create({
          video: video._id,
          likedBy: req.user?._id,
        });

        return res
          .status(200)
          .json(new ApiResponse(200, likeDoc, "liked successfully"));
      }

      const unLikeDoc = await Like.findByIdAndDelete(isLiked._id);

      return res
        .status(200)
        .json(new ApiResponse(200, unLikeDoc, "UnLiked Successfully"));
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "something went wrong while toggling video like"
      );
    }
  }
);

const toggleCommentLike = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;

    if (!commentId || !isValidObjectId(commentId)) {
      throw new ApiError(400, "commentId is required or Invalid commentId");
    }

    try {
      const comment = await Comment.findById(commentId);
      if (!comment) {
        throw new ApiError(404, "Comment not found");
      }

      const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id,
      });

      if (!isLiked) {
        const likeDoc = await Like.create({
          comment: commentId,
          likedBy: req.user?._id,
        });

        return res
          .status(200)
          .json(new ApiResponse(200, likeDoc, "Liked Successfully"));
      }

      const unLikeDoc = await Like.findByIdAndDelete(isLiked._id);

      return res
        .status(200)
        .json(new ApiResponse(200, unLikeDoc, "UnLiked Successfully"));
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "Something went wrong while toggling comment like"
      );
    }
  }
);

const toggleTweetLike = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { tweetId } = req.params;

    if (!tweetId || !isValidObjectId(tweetId)) {
      throw new ApiError(400, "tweetId is required or Invalid tweetId ");
    }

    try {
      const tweet = await Tweet.findById(tweetId);

      if (!tweet) {
        throw new ApiError(404, "Tweet not found");
      }

      const isLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id,
      });

      if (!isLiked) {
        const likeDoc = await Like.create({
          tweet: tweetId,
          likedBy: req.user?._id,
        });

        return res
          .status(200)
          .json(new ApiResponse(200, likeDoc, "Liked Successfully"));
      }

      const unLikeDoc = await Like.findByIdAndDelete(isLiked._id);

      return res
        .status(200)
        .json(new ApiResponse(200, unLikeDoc, "UnLiked Successfully"));
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "SomeThing went wrong while toggling tweet like"
      );
    }
  }
);

const getLikedVideos = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;

    try {
      const likedVideos = await Like.aggregate([
        {
          $match: {
            likedBy: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "likedVideos",
          },
        },
        {
          $unwind: "$likedVideos",
        },
        {
          $lookup: {
            from: "users",
            let: { owner_id: "$likedVideos.owner" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$_id", "$$owner_id"],
                  },
                },
              },
              {
                $project: {
                  avatar: 1,
                  userName: 1,
                  fullName: 1,
                  _id: 0,
                },
              },
            ],
            as: "owner",
          },
        },
        {
          $unwind: {
            path: "$owner",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: "$likedVideos._id",
            title: "$likedVideos.title",
            thumbnail: "$likedVideos.thumbnail",
            duration: "$likedVideos.duration",
            createdAt: "$likedVideos.createdAt",
            views: "$likedVideos.views",
            owner: {
              userName: "$owner.userName",
              avatar: "$owner.avatar",
              fullName: "$owner.fullName",
            },
          },
        },
        {
          $group: {
            _id: null,
            likedVideos: {
              $push: "$$ROOT",
            },
          },
        },
        {
          $project: {
            _id: 0,
            likedVideos: 1,
          },
        },
      ]);

      if (likedVideos.length === 0) {
        return res
          .status(404)
          .json(new ApiResponse(404, [], "No liked videos found"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, likedVideos, "likedVideos fetched successfully")
        );
    } catch (error: any) {
      throw new ApiError(500, error?.message || "unable to fetch likedVideos");
    }
  }
);

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos };
