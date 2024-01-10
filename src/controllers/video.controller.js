import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PublishAVideoBodySchema } from "../schema/video.schema.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

  const videoThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const video = await uploadOnCloudinary(videoLocalPath);

  const newVideo = await Video.create({
    videoFile: video.url,
    thumbnail: videoThumbnail.url,
    title: title.trim(),
    description: description.trim(),
    duration: video.duration ?? 0,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      video: newVideo,
    })
  );
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
