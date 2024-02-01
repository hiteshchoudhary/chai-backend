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
  // searchQuery and search by userQuery
  const searchQuery = query ? { $text: { $search: query } } : {};
  const userQuery = userId ? { userId: userId } : {};

  // searchQuery and search by userQuery combined
  const combinedQuery = { ...searchQuery, ...userQuery };

  // sorting query
  const sortOptions = sortBy ? { [sortBy]: sortType === "desc" ? -1 : 1 } : {};

  // Find video based on the queries
  let videos = await Video.find(combinedQuery)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(Number(limit));

  if (!videos) {
    throw new ApiError(404, "Error while fetching the videos");
  }

  // Return res
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video

  // Get title and description
  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(200, "Title and Description is required");
  }

  // Get video file
  const videoFilePath = req.files?.videoFile[0]?.path;
  if (!videoFilePath) {
    throw new ApiError(400, "Video is required");
  }

  // Get thumbnail file
  const thumbnailPath = req.files?.thumbnail[0]?.path;
  if (!thumbnailPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  // Upload video file to Cloudinary
  let videoFile = await uploadOnCloudinary(videoFilePath, {
    resource_type: "video",
  });
  if (!videoFile.url) {
    throw new ApiError(400, "Video File is required");
  }

  // Upload thumbnail file to Cloudinary
  let thumbnail = await uploadOnCloudinary(thumbnailPath);
  if (!thumbnail) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const user = req.user;

  // Create video document
  const uploadedVideo = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title: title,
    description: description,
    duration: videoFile.duration,
    owner: user._id,
  });

  if (!uploadedVideo) {
    throw new ApiError(500, "Something went wrong while uploading the video");
  }

  // Connect video to the user
  await User.updateOne(
    { _id: user._id },
    { $push: { videos: uploadedVideo._id } }
  );

  // store response in variable
  const userProfile = await User.findOne({ _id: user._id }).populate("videos");

  // return response
  return res
    .status(201)
    .json(
      new ApiResponse(200, { user: userProfile }, "Video uploaded successfully")
    );
});

const getUserVideos = asyncHandler(async (req, res) => {
  let { userId } = req.params;
  let user = await User.findById({ _id: userId });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const videos = await Video.find({
    owner: user._id,
  });

  res
    .status(200)
    .json(new ApiResponse(200, { videos }, "Videos found Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  // Get video
  let video = await Video.findById({
    _id: videoId,
  });

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  // Return res
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Found Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  // Get video
  let videoToUpdate = await Video.findById(videoId);

  if (!videoToUpdate) {
    throw new ApiError(404, "Video not found to update");
  }

  // Get title or description
  const { title, description } = req.body;

  // check if something is updated or not if not return res
  if (!req.file && title.trim() === "" && description.trim() === "") {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          {},
          "At least one field (title, description, or file) should be updated"
        )
      );
  }

  // Update the fields if updated by the user
  if (title.trim() !== "") {
    videoToUpdate.title = title;
  }

  if (description.trim() !== "") {
    videoToUpdate.description = description;
  }

  if (req.file && req.file.path) {
    let thumbnail = req.file.path;
    let uploadedThumbnail = await uploadOnCloudinary(thumbnail);
    // console.log(uploadedThumbnail)
    videoToUpdate.thumbnail = uploadedThumbnail.url;
  }

  // save changes in the document
  await videoToUpdate.save();

  // return res
  return res
    .status(200)
    .json(new ApiResponse(200, videoToUpdate, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  // Get the video and delete it
  const deletedVideo = await Video.deleteOne({ _id: videoId });

  // console.log(deleteVideo);

  if (deletedVideo.deletedCount === 0) {
    throw new ApiError(404, "Video not found to delete");
  }

  // Return res
  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // get video
  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw new ApiError(404, "Video not found to update public state");
  }

  // Toggle isPublished
  existingVideo.isPublished = !existingVideo.isPublished;

  // save changes
  const updatedVideo = await existingVideo.save();

  // return res
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedVideo,
        "Video public status changed successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  getUserVideos,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
