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

  const skipedVideos = (page - 1) * 10;

  const sortingVideo = {};
  if (sortBy && sortType) {
    sortingVideo[sortBy] = sortType === "ase" ? 1 : -1;
  } else {
    sortingVideo["createdAt"] = -1;
  }

  const pipeline = [];
  // console.log(userId, req.user?._id);

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(404, "userId not found");
  }

  pipeline.push({
    $match: {
      owner: new mongoose.Types.ObjectId(userId)
    }
  })

  if (query) {
    pipeline.push({
      $match: {
        $text: {
          $search: query
        }
      }
    })
  }
  if (sortingVideo) {
    pipeline.push({
      $sort: sortingVideo,
    })
  }
  pipeline.push({
    $skip: skipedVideos,
  })
  pipeline.push({
    $limit: limit,
  })

  const videoList = await Video.aggregate(pipeline);


  res
    .status(200)
    .json(new ApiResponse(200, videoList, "successfully get videos"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!(title && description)) {
    throw new ApiError(400, "title and description is required");
  }

  const videoLocalpath = req.files?.videoFile[0].path;
  const thumbnailLocalpath = req.files?.thumbnail[0].path;

  if (!videoLocalpath) {
    throw new ApiError(400, "Not Found video file");
  }
  if (!thumbnailLocalpath) {
    throw new ApiError(400, "Not Found thumbnail file");
  }

  const videoUrl = await uploadOnCloudinary(videoLocalpath);
  const thumbnailUrl = await uploadOnCloudinary(thumbnailLocalpath);

  if (!(videoUrl && thumbnailUrl)) {
    throw new ApiError(400, "Url not found");
  }

  const publishVideo = await Video.create({
    videoFile: videoUrl?.url,
    thumbnail: thumbnailUrl?.url,
    title,
    description,
    duration: videoUrl?.duration,
    isPublished: false,
    owner: req?.user._id,
  });

  if (!publishVideo) {
    throw new ApiError(400, "Not published successfully");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, publishVideo, "Video published sucessfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId) {
    new ApiError(404, "Not Found Video Id");
  }

  const video = await Video.findById(videoId);

  // console.log(video);
  if (!video) {
    res
      .status(200)
      .json(new ApiResponse(200, video, "No video founded"));
  }


  return res
    .status(200)
    .json(new ApiResponse(200, video, "Successfully got video"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  // console.log(videoId);
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is not valid")
  }
  const video = await Video.findById(videoId);
  // console.log(toString(video.owner), toString(req.user?._id));


  if (!video && !toString(video.owner) == toString(req.user?._id)) {
    throw new ApiError(400, "video not founded");
  }

  const { title, description } = req.body;
  const localThumbnail = req.file?.path;

  if (!(title && description)) {
    throw new ApiError(404, "not founded anything");
  }
  if (!localThumbnail) {
    throw new ApiError(404, "Not founded local path for thumbnail");
  }

  const thumbnail = await uploadOnCloudinary(localThumbnail);

  if (!localThumbnail) {
    throw new ApiError(404, "Not found thumbnail url");
  }
  const updatedVideoDetails = await Video.findByIdAndUpdate(videoId, {
    title,
    description,
    thumbnail: thumbnail?.url,
  }, { new: true });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideoDetails, "Successfully updated"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId) {
    throw new ApiError(400, "Video Id not founded");
  }

  const video = await Video.findById(videoId, { new: true });
  if (!video || !toString(video.owner) === toString(req?.user._id)) {
    throw new ApiError(400, "Video not founded");
  }
  const deleteVideo = await Video.findByIdAndDelete(videoId);
  console.log(deleteVideo);
  if (!deleteVideo) {
    throw new ApiError(400, "Video not deleted");
  }


  return res
    .status(200)
    .json(new ApiResponse(200, deleteVideo, "Successfully deleted the video"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video Id not founded");
  }

  const video = await Video.findById(videoId);
  console.log(video);
  if (!(video && toString(video.owner) === toString(req.user?._id))) {
    throw new ApiError(400, "Video not founded");
  }
  const isPublished = !video.isPublished;

  const toggleIsPublished = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { isPublished: isPublished },
    },
    { new: true }
  );

  if (!toggleIsPublished) {
    throw new ApiError(400, "Something went wrong to toggle the publish state");
  }


  return res.status(200).json(
    new ApiResponse(200, toggleIsPublished, "Updated toggle state successfully")
  )

});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
