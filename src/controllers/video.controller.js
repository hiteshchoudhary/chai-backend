import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 2, query, sortBy, sortType, userId } = req.query;
  // console.log(query);

  let filter = {};
  let option = {
    limit,
    skip: (page - 1) * limit,
  };
  let sorting = {};

  if (sortType && sortBy) {
    sorting[sortBy] = sortType;
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
    throw new ApiError(409, "title and description must be requried");
  }

  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(409, "videoFile and thumbnail is requried");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile || !thumbnail) {
    throw new ApiError(501, "error while uploading videoFile and thumbnail");
  }

  // console.log(videoFile)

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    duration: videoFile.duration,
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
  if (!videoId) {
    throw new ApiError(401, "videoId mustbe requried");
  }

  const video = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
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
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);
  if (video?.length === 0) {
    throw new ApiError(409, "could not find video of this id");
  }
  // console.log(video)

  return res
    .status(201)
    .json(new ApiResponse(200, video[0], "video found sucessfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  //TODO: update video details like title, description, thumbnail
  if (!videoId) {
    throw new ApiError(401, "videoId must be requried");
  }
  if (!title && !description) {
    throw new ApiError(409, "title or description requried ");
  }
  const thumbnailLocalPath = req.file?.path;

  const thumbnail = uploadOnCloudinary(thumbnailLocalPath);
  const video = await Video.findById({
    _id: new mongoose.Types.ObjectId(videoId),
  });
  if (!video) {
    throw new ApiError(405, "video was not found");
  }
  if (title) {
    video.title = title;
  }
  if (description) {
    video.description = description;
  }
  if (title) {
    video.title = title;
  }
  if (thumbnail?.url) {
    video.thumbnail = thumbnail.url;
  }
  await video.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(200, video, "update succesfully"));
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
