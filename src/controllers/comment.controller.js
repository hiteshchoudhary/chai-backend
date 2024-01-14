import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { addCommentSchema } from "../schema/comment.schema.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
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
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
