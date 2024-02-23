import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/ApiError.ts";
import { Video } from "../models/video.models.ts";
import { Comment } from "../models/comment.models.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { AuthenticatedRequest } from "./user.controller.ts";
import { Request, Response } from "express";

const isOwnerOfComment = async (commentId: string, userId: string) => {
  try {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new ApiError(404, "There is no comment");
    }

    if (comment.owner.toString() !== userId.toString()) {
      return false;
    }

    return true;
  } catch (error: any) {
    throw new ApiError(500, error?.message || "comment does not exist's");
  }
};

const addComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { videoId } = req.params;
    const { commentContent } = req.body;

    if (!videoId) {
      throw new ApiError(400, "videoId is required");
    }

    if (!commentContent) {
      throw new ApiError(400, "content is required");
    }

    try {
      const video = await Video.findById(videoId);
      if (
        !video ||
        (video?.owner.toString() !== req.user?._id.toString() &&
          !video.isPublished)
      ) {
        throw new ApiError(400, "There is no such video");
      }

      const comment = await Comment.create({
        content: commentContent,
        video: videoId,
        owner: req.user?._id,
      });

      if (!comment) {
        throw new ApiError(500, "Unable to create comment");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, comment, "comment posted successfully"));
    } catch (error: any) {
      throw new ApiError(500, error?.message || "Unable to create comment");
    }
  }
);

const getVideoComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { videoId } = req.params;

    let { page: pageNumber = 1, limit: limitNumber = 10 } = req.query;

    if (!videoId || !isValidObjectId(videoId)) {
      throw new ApiError(400, "videoId is required or invalid");
    }

    let page = isNaN(Number(pageNumber)) ? 1 : Number(pageNumber);
    let limit = isNaN(Number(limitNumber)) ? 10 : Number(limitNumber);

    if (page < 0) {
      page = 1;
    }

    if (limit <= 0) {
      limit = 10;
    }

    try {
      const video = await Video.findById(videoId);

      if (!video) {
        await Comment.deleteMany({ video: videoId });
        return res
          .status(200)
          .json(
            new ApiResponse(
              404,
              {},
              "There is no such video and all associated comments have been deleted"
            )
          );
      }

      const allComments = await Comment.aggregate([
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
          $unwind: "$owner",
        },
        {
          $lookup: {
            from: "likes",
            let: { commentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ["$comment", "$$commentId"],
                  },
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "likedBy",
                  foreignField: "_id",
                  as: "likedByInfo",
                },
              },
              {
                $unwind: "$likedByInfo",
              },
              {
                $project: {
                  _id: 1,
                  userInfo: {
                    userName: "$likedByInfo.userName",
                    avatar: "$likedByInfo.avatar",
                    fullName: "$likedByInfo.fullName",
                  },
                  likedBy: 1,
                },
              },
            ],
            as: "likes",
          },
        },
        {
          $addFields: {
            likesCount: {
              $size: "$likes",
            },
            isLiked: {
              $cond: {
                if: {
                  $in: [
                    new mongoose.Types.ObjectId(req.user?._id),
                    "$likes.likedBy",
                  ],
                },
                then: true,
                else: false,
              },
            },
          },
        },
        {
          $project: {
            content: 1,
            createdAt: 1,
            owner: {
              _id: "$owner._id",
              userName: "$owner.userName",
              avatar: "$owner.avatar",
              fullName: "$owner.fullName",
            },
            likesCount: 1,
            _id: 1,
            isLiked: 1,
            userlikes: {
              $map: {
                input: "$likes",
                as: "userlike",
                in: {
                  _id: "$$userlike._id",
                  userInfo: "$$userlike.userInfo",
                  likedBy: "$$userlike.likedBy",
                },
              },
            },
          },
        },
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
      ]);

      if (!allComments || allComments.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, allComments, "No Comments in this video"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            allComments,
            "all comments of video fetched successfully"
          )
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "something went wrong while fetching video comments"
      );
    }
  }
);

const updateComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;

    if (!commentId || !isValidObjectId(commentId)) {
      throw new ApiError(400, "commentId is required or invalid");
    }

    const { commentContent } = req.body;

    if (!commentContent) {
      throw new ApiError(400, "commentContent is required");
    }

    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        throw new ApiError(404, "Comment not found");
      }

      const videoId: string = comment.video.toString();

      const video = await Video.findById(videoId);

      if (!video) {
        await Comment.deleteMany({ video: videoId });

        return res
          .status(200)
          .json(new ApiResponse(200, {}, "Comment does not exist"));
      }

      const commentOwner = await isOwnerOfComment(commentId, req.user?._id);

      if (!commentOwner) {
        throw new ApiError(403, "Unauthorized Access");
      }

      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
          $set: {
            content: commentContent,
          },
        },
        { new: true }
      );

      if (!updatedComment) {
        throw new ApiError(500, "Unable to update comment");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, updatedComment, "Comment updated successfully")
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "something went wrong while updating comment"
      );
    }
  }
);

const deleteComment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { commentId } = req.params;

    if (!commentId || !isValidObjectId(commentId)) {
      throw new ApiError(400, "commentId is required or invalid");
    }

    try {
      const comment = await Comment.findById(commentId);

      if (!comment) {
        throw new ApiError(404, "there is no comment");
      }

      const videoId: string = comment.video.toString();

      const video = await Video.findById(videoId);

      if (!video) {
        await Comment.deleteMany({ video: videoId });
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              {},
              "There is no such Video. All associated comments have been deleted"
            )
          );
      }

      const commentOwner = await isOwnerOfComment(commentId, req.user?._id);

      if (!commentOwner) {
        throw new ApiError(300, "Unauthorized Access");
      }

      const deletedComment = await Comment.findByIdAndDelete(commentId);

      if (!deletedComment) {
        throw new ApiError(500, "Unable to delete the comment");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, deletedComment || "Comment deleted successfully")
        );
    } catch (error: any) {
      throw new ApiError(500, error?.message || "Unable to delete comment");
    }
  }
);

export { addComment, getVideoComment, updateComment, deleteComment };
