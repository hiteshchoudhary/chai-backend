import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PublishAVideoBodySchema } from "../schema/video.schema.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  // const { title, description} = req.body
  // TODO: get video, upload to cloudinary, create video

  const { _id } = req.user;

  const requestBodyValidationResult = PublishAVideoBodySchema.safeParse(
    req.body
  );

  if (!requestBodyValidationResult.success) {
    throw new ApiError(
      400,
      requestBodyValidationResult.error.errors[0]?.message,
      requestBodyValidationResult.error.errors.map((e) => e.message)
    );
  }

  const { description, title } = requestBodyValidationResult.data;

  const videoLocalPath = req.files["videoFile"][0]?.path;
  const thumbnailLocalPath = req.files["thumbnail"][0]?.path;

  //TODO: Complete two paths by tomorrow.

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
