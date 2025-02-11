import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const pageNumber = parseInt(page);
  const pageLimit = parseInt(limit);

  let searchConditions = {};

  if (query) {
    searchConditions = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    };
  }

  if (userId && isValidObjectId(userId)) {
    searchConditions.userId = userId;
  }

  const sortOrder = sortType === "asec" ? 1 : -1;

  const videos = await Video.find(searchConditions)
    .sort(sortOrder)
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit);

  const totalVideos = await Video.countDocuments(searchConditions);

  const totalPages = Math.celi(totalVideo / pageLimit);

  return res.status(200).json(
    new ApiResponse({
      success: true,
      message: "Videos retrived successfully",
      data: videos,
      pagination: {
        page: pageNumber,
        limit: pageLimit,
        totalPages,
        totalVideos,
      },
    })
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description || req.files || !req.files.video) {
    throw new ApiError(
      400,
      "Title, description and requested files are required"
    );
  }

  const videoFile = req.files.video;

  try {
    const uploadResponse = await uploadOnCloudinary(videoFile.path, "vieo");
    const videoUrl = uploadResponse.secure_url;

    const thumbnailUrl = uploadResponse.thumbnail_url || "";

    const newVideo = await Video.create({
      title,
      description,
      videoUrl,
      thumbnail: thumbnailUrl,
      userId: req.user.id,
      publishStatus: false,
    });

    res.status(201).json(
      new ApiResponse({
        success: true,
        message: "video published successfully",
        data: newVideo,
      })
    );
  } catch (error) {
    console.error("error uplodaing video", error);
    throw new ApiError(500, "failed to publish, video please try again later ");
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (req.user.id !== video.userId.toString()) {
    throw new ApiError(403, "you are not authorized to video this video");
  }

  res.status(200).json(
    new ApiResponse({
      success: true,
      message: "video retrieved successfully",
      data: video,
    })
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const { title, description, thumbnail } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "invalid video ID format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  if (req.user.id !== video.userId.toString()) {
    throw new ApiError(
      400,
      "you are not authorize to update or access this video"
    );
  }

  if (title) video.title = title;
  if (description) video.description = description;
  if (thumbnail) video.thumbnail = thumbnail;

  await video.save();

  res.status(200).json(
    new ApiResponse(200, {
      success: true,
      message: "description, thumbnail, title updated successfully",
      data: video,
    })
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID format.");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video not found.");
  }

  if (req.user.id !== video.userId.toString()) {
    throw new ApiError(403, "you are not authorize to access this video");
  }

  try {
    await uploadOnCloudinary.deleteResource(video.cloudinaryPublicId);
  } catch (error) {
    console.error("error while deleting the video from cloudinary", error);
    throw new ApiError(500, "video could not be deleted from cloudinary");
  }

  await video.remove();

  res
    .status(200)
    .json(
      new ApiResponse({ success: true, message: "video deleted successfully" })
    );
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Inavlaid ID format");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!req.user.id !== Video.userId.toString()) {
    throw new ApiError(500, "you are not allowed to access this video");
  }

  video.published = !video.published;

  await Video.save();

  res.status(200).json(
    new ApiResponse({
      success: true,
      message: `Video ${
        video.publish ? "published" : "unpublished"
      } successfully`,
    })
  );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
