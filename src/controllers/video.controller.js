import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteOnCloudinary,
  deleteVideoOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  // Constructing the base query
  const baseQuery = {};

  // Adding additional filters based on query parameters
  if (query) {
    baseQuery.$or = [
      { title: { $regex: query, $options: "i" } }, // Case-insensitive search in the title
      { description: { $regex: query, $options: "i" } }, // Case-insensitive search in the description
    ];
  }

  // Sorting
  const sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
  }

  try {
    // Performing the query with pagination and sorting
    const videos = await Video.aggregatePaginate(
      Video.aggregate([
        { $match: { ...baseQuery, owner: userId } }, // Add owner filter if userId is provided
        { $sort: sortOptions },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) },
      ])
    );

    res.status(200).json({
      success: true,
      data: videos,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: error.message,
    });
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user._id;
  // TODO: get video, upload to cloudinary, create video
  try {
    const videoUrl = req?.files.videoUrl;
    console.log("video here", videoUrl);
    const thumbnail = req?.files.thumbnail;
    console.log("thumbnail here", thumbnail);

    if (!title || !description || !videoUrl || !thumbnail) {
      throw new ApiError(400, "Missing data");
    }
    //Uploading video File to Cloudinary
    const videoFile = videoUrl
      ? await uploadOnCloudinary(
          videoUrl[0].path,
          process.env.FOLDER_NAME,
          null,
          100
        )
      : null;
    console.log("videoFile here", videoFile);
    // Uploading Thumbnail image to Cloudinary
    const thumbnailFile = thumbnail
      ? await uploadOnCloudinary(
          thumbnail[0].path,
          process.env.FOLDER_NAME,
          null,
          100
        )
      : null;
    console.log("thumbnailFile", thumbnailFile);
    const newVideo = await Video.create({
      videoFile: videoFile.secure_url,
      thumbnail: thumbnailFile.secure_url,
      title,
      description,
      duration: (videoFile.duration / 60).toFixed(2),
      owner: userId,
    });
    res
      .status(201)
      .json(new ApiResponse(200, newVideo, "Video uploaded successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); // successfully publish kardia

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  try {
    const result = await Video.findById(videoId);
    if (!result) {
      throw new ApiError(400, "Could not find video");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, result, "Video fetched successfully"));
  } catch (error) {
    console.log("something went wrong");

    throw new ApiError(500, "something went wrong", error.message);
  }
}); // successfully video fetch karlia

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  try {
    const video = await Video.findById(videoId);
    const { title, description } = req.body;
    const thumbnail = req.file;
    if (!title && !description && !thumbnail) {
      throw new ApiError(400, "Please provide atleast one filed");
    }
    //upload new thumbnail
    let imgUrl;
    if (thumbnail) {
      imgUrl = await uploadOnCloudinary(thumbnail.path);
    }
    //Delete old thumbnail
    const thumbnailToDelete = video.thumbnail;
    console.log(thumbnailToDelete);
    thumbnailToDelete ? deleteOnCloudinary(thumbnailToDelete) : null;
    const updatedVideo = await Video.findOneAndUpdate(
      { _id: videoId },
      {
        title,
        description,
        thumbnail: imgUrl.secure_url,
      },
      { new: true }
    );
    return res
      .status(201)
      .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //done

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  try {
    const video = await Video.findById(videoId);
    console.log("this video", video);
    if (!video) {
      throw new ApiError(400, "Video not found");
    }
    //delete video from cloudinary
    const videoToDelete = await deleteVideoOnCloudinary(video?.videoFile);
    //delete thumbnail from cloudinary
    console.log(video?.thumbnail);
    const thumbnailToDelete = await deleteOnCloudinary(video?.thumbnail);
    const result = await Video.findByIdAndDelete(videoId);
    //delete video from owner
    if (!result) {
      throw new ApiError(400, "Cannot delete video");
    }
    res
      .status(201)
      .json(new ApiResponse(200, result, "Video deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //done

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    video.isPublished = !video.isPublished;
    await video.save();
    res
      .status(200)
      .json(new ApiResponse(200, video, "changes made successfull"));
  } catch (error) {
    throw new ApiError(500, "something went wrong", error.message);
  }
}); //nailed it

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
