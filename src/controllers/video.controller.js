import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = " ",
    sortBy,
    sortType,
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  // console.log("query ", query, " userId ", userId);

  let filter = {};

  let options = {
    page: isNaN(page) ? 1 : Number(page),
    limit: isNaN(limit) ? 10 : Number(limit),
  };

  let aggregateOptions = [
    {
      $match: {
        $and: [
          {
            isPublished: true,
          },
          {
            $text: {
              $search: query,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        score: {
          $meta: "textScore",
        },
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
              username: 1,
              fullName: 1,
              avatar: 1,
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
      },
    },
    {
      $sort: {
        score: -1,
        views: -1,
      },
    },
  ];

  const videos = await Video.aggregatePaginate(aggregateOptions, options);

  if (!videos) {
    throw new ApiError(500, "something want wrong while get all videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "get all videos successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished = true } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (
    [title, description].some(
      (field) => field?.trim() === "" || field.trim() === undefined
    )
  ) {
    throw new ApiError(400, `${field} is required`);
  }

  let videoLocalPath;
  let thumbnailLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoLocalPath = req.files.videoFile[0].path;
  }

  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
  }

  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  console.log("Uploaded video file ", videoFile);

  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title: title,
    description: description,
    duration: videoFile.duration,
    isPublished: isPublished,
    owner: user,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    throw new ApiError(404, "Video not found");
  }

  if (isValidObjectId(videoId)) {
    throw new ApiError(404, "Video id is not correct");
  }

  const video = await Video.findById(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetch successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;

  if (!videoId) {
    throw new ApiError(404, "Video not found");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details update successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId) {
    throw new ApiError(404, "Video not found");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || isValidObjectId(videoId)) {
    throw new ApiError(404, "Video not found ");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found ");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        `Publish status toggled successfully. New status: ${
          video.isPublished ? "Published" : "Unpublished"
        }`,
        video
      )
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
