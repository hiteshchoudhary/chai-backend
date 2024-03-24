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
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  if (!isValidObjectId(req.user._id)) {
    throw new ApiError(400, "Invalid user");
  }

  try {
    //must not need to use await as we need aggregation pipeline for using aggregatePaginate
    const videos = Video.aggregate([
      {
        $match: {
          owner: req.user?._id,
          title: { $regex: query, $options: "i" },
        },
      },
    ]).sort({
      [`${sortType}`]: `${sortBy}`,
    });

    const options = {
      page,
      limit,
    };

    const data = await Video.aggregatePaginate(
      videos,
      options,
      (err, result) => {
        if (err) {
          throw new ApiError(400, "Videos pagination failed!");
        }
        return result;
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, data, "Videos fetched Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong. Video not fetched!!"
    );
  }

  //TODO: get all videos based on query, sort, pagination
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { videoFile, thumbnail } = req?.files;

  const [{ path: videoPath }] = videoFile;
  const [{ path: thumbnailPath }] = thumbnail;

  if (!isValidObjectId(req.user._id)) {
    throw new ApiError(400, "Invalid user");
  }

  if (!videoPath || !thumbnailPath) {
    throw new ApiError(400, "Invalid file paths");
  }

  try {
    const videoFileResponse = await uploadOnCloudinary(videoPath);
    const thumbnailResponse = await uploadOnCloudinary(thumbnailPath);

    const video = await Video.create({
      title,
      description,
      videoFile: videoFileResponse.url,
      thumbnail: thumbnailResponse.url,
      duration: videoFileResponse.duration,
      owner: req.user._id,
    });

    await video.save();

    return res
      .status(201)
      .json(new ApiResponse(201, video, "Video published Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong. Video not published!!"
    );
  }

  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  try {
    const video = await Video.findById({ _id: videoId });

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video fech Successfully"));
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong. Video not fetched!!"
    );
  }
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
