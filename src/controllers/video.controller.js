import mongoose, { isValidObjectId, Schema } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteImageFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const match = {
    isPublished: true,
  };
  const sort = {};
  const options = { page: Number(page), limit: Number(limit) };

  if (query?.trim()) match.title = { $regex: query.trim(), $options: "i" };
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user id format");
    }
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    match["owner._id"] = new mongoose.Types.ObjectId(userId);
  }

  if (sortBy && typeof sortBy === "string") {
    const sortOrder = sortType?.toLowerCase() === "asc" ? 1 : -1;
    sort[sortBy] = sortOrder;
  }

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        "owner.refreshToken": 0,
        "owner.password": 0,
      },
    },
  ];

  if (userId) {
    // we need the owner (user) Object
    // which gets created after the lookup
    pipeline.push({
      $match: match,
    });
  } else {
    // match early
    pipeline.unshift({
      $match: match,
    });
  }

  if (Object.keys(sort).length > 0) {
    pipeline.push({ $sort: sort });
  }

  const videoAggregation = Video.aggregate(pipeline);

  const paginatedVideos = await Video.aggregatePaginate(
    videoAggregation,
    options
  );

  return res
    .status(200)
    .json(new ApiResponse(200, paginatedVideos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "All fields are required");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Video file and thumbnail image are required");
  }

  const [videoFile, thumbnail] = await Promise.all([
    uploadOnCloudinary(videoFileLocalPath),
    uploadOnCloudinary(thumbnailLocalPath),
  ]);

  if (!videoFile?.url) {
    throw new ApiError(500, "Failed to upload video to Cloudinary");
  }

  if (!thumbnail?.url) {
    throw new ApiError(500, "Failed to upload thumbnail image to Cloudinary");
  }

  const createdVideo = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title: title?.trim(),
    description: description?.trim(),
    duration: videoFile.duration,
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, createdVideo, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId?.trim()) {
    throw new ApiError(401, "video id is required");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        "owner.refreshToken": 0,
        "owner.password": 0,
      },
    },
  ]);

  if (!video) {
    throw new ApiError(401, "video id is invalid");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video retrieved successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const { title, description } = req.body;

  const updateData = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      throw new ApiError(400, "Title must be a non-empty string");
    }
    updateData.title = title.trim();
  }

  if (description !== undefined) {
    if (typeof description !== "string" || description.trim() === "") {
      throw new ApiError(400, "Description must be a non-empty string");
    }
    updateData.description = description.trim();
  }

  if (req.file?.path) {
    const thumbnailLocalPath = req.file.path;

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
      throw new ApiError(500, "Failed to upload thumbnail image to cloudinary");
    }

    const isOldThumbnailDeleted = await deleteImageFromCloudinary(
      video.thumbnail
    );

    if (!isOldThumbnailDeleted) {
      throw new ApiError(
        500,
        "Something went wrong while deleting old thumbnail"
      );
    }

    updateData.thumbnail = thumbnail.url;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No valid fields provided to update");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updateData,
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(500, "Something went wrong while updating the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video is updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const [isThumbnailDeleted, isVideoFileDeleted] = await Promise.all([
    deleteImageFromCloudinary(video.thumbnail),
    deleteImageFromCloudinary(video.videoFile),
  ]);

  const successStates = ["ok", "not found"];
  if (
    !successStates.includes(isThumbnailDeleted) ||
    !successStates.includes(isVideoFileDeleted)
  ) {
    throw new ApiError(500, "Failed to delete video file and thumbnail");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video publish status updated."));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
