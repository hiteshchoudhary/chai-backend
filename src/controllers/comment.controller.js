import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId, Types } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { addCommentSchema } from "../schema/comment.schema.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page, limit } = req.query;

  const pageNumber = Number(page) ? Number.parseInt(page) : 1;
  const limitSize = Number(limit) ? Number.parseInt(limit) : 10;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Provide a valid ObjectID as videoId", [
      "Provide a valid ObjectID as videoId",
    ]);
  }

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              avatar: 1,
              username: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "likedBy",
        pipeline: [
          {
            $project: {
              likedBy: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likes: {
          $size: "$likedBy",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$likedBy.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $unset: ["likedBy"],
    },
    {
      $skip: (pageNumber - 1) * limitSize,
    },
    {
      $limit: limitSize,
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      comments,
    })
  );
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Provide a valid ObjectID as videoId", [
      "Provide a valid ObjectID as videoId",
    ]);
  }

  const requestBodyValidationResult = addCommentSchema.safeParse(req.body);

  if (!requestBodyValidationResult.success) {
    throw new ApiError(
      400,
      requestBodyValidationResult.error.errors[0]?.message,
      requestBodyValidationResult.error.errors.map((err) => err.message)
    );
  }

  const { content } = requestBodyValidationResult.data;

  const comment = await Comment.create({
    video: videoId?.trim(),
    owner: _id,
    content: content.trim(),
  });

  // ! If required can create a pipeline here as well.

  return res.status(200).json(
    new ApiResponse(200, {
      comment,
    })
  );
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { _id } = req.user;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Provide a valid ObjectID as commentId", [
      "Provide a valid ObjectID as commentId",
    ]);
  }

  const requestBodyValidationResult = addCommentSchema.safeParse(req.body);

  if (!requestBodyValidationResult.success) {
    throw new ApiError(
      400,
      requestBodyValidationResult.error.errors[0]?.message,
      requestBodyValidationResult.error.errors.map((err) => err.message)
    );
  }

  const { content } = requestBodyValidationResult.data;

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: _id,
    },
    {
      content,
    },
    {
      new: true,
    }
  );

  if (!updatedComment) {
    throw new ApiError(400, "No comment found!!", ["No comment found!!"]);
  }

  return res.status(200).json(
    new ApiResponse(200, {
      updatedComment,
    })
  );
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
