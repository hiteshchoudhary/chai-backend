import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 2, limit = 2, query, sortBy, sortType, userId } = req.query;
  // console.log(query);

  let filter = {};
  let option = {
    limit,
    skip: (page - 1) * limit,
  };
  let sorting = {};

  if (sortType && sortBy) {
    sorting.sortBy = sortType;
  }

  if (query) {
    filter.$or = [
      {
        title: { $regex: new RegExp(query, "i") },
      },
      {
        description: { $regex: new RegExp(query, "i") },
      },
    ];
  }
  if (userId) {
    filter.owner = userId;
  }

  if (Object.keys(filter).length === 0) {
    throw new ApiError(400, "query must be requried");
  }

  const allVideos = await Video.find(filter, null, option).sort(sorting);
  // console.log(allVideos);

  if (allVideos.length === 0) {
    throw new ApiError(401, "videos not found");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, allVideos, "videos found sucessfully"));
});



const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !description) {
    throw ApiError(409, "title and description must be requried");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw ApiError(409, "videoFile and thumbnail is requried");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile || !thumbnail) {
    throw ApiError(409, "videoFile and thumbnail is requried");
  }
  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(200, video, "sucessfully video is upload in database")
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
