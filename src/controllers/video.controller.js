import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, DeleteFile } from "../utils/cloudinary.js";
import { Subscription} from "../models/subscription.model.js"

const getAllVideos = asyncHandler(async (req, res) => {
  // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
  //TODO: get all videos based on query, sort, pagination
  const { page = 1, limit = 10 } = req.query;
  // console.log('paeg and limit ',page,limit);
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: { path: "owner", select: "username email avatar" },
  };
  console.log("option", options);

  const result = await Video.aggregatePaginate(
    [
      {
        $match: { isPublished: true },
      },
    ],
    options
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", result));
});

const publishAVideo = asyncHandler(async (req, res) => {
  // const { title, description} = req.body
  // TODO: get video, upload to cloudinary, create video
  const title = req.body?.title;
  const description = req.body?.description;
  const duration = parseFloat(req.body?.duration);
  const videoFile = req.files?.videoFile?.[0]?.path;
  const thumbnail = req.files?.thumbnail?.[0]?.path;

  console.log(
    "this areall fields",
    title,
    description,
    duration,
    videoFile,
    thumbnail
  );

  if (!videoFile || !thumbnail || !title || !description || !duration) {
    throw new ApiError(400, "All fields are required");
  }
  const userId = req.user._id;
  const videoCloudinaryData = await uploadOnCloudinary(videoFile);
  const thumbnailCloudinaryData = await uploadOnCloudinary(thumbnail);
  const videoFilePublicId = videoCloudinaryData.public_id;
  const thumbnailPublicId = thumbnailCloudinaryData.public_id;

  const videoLink = videoCloudinaryData.url;
  const thumbnailLink = thumbnailCloudinaryData.url;

  const newVideo = new Video({
    videoFile: videoLink,
    thumbnail: thumbnailLink,
    title,
    description,
    duration,
    owner: userId,
    videoFilePublicId,
    thumbnailPublicId,
  });
  await newVideo.save();
  if (!newVideo) {
    throw new ApiError(500, "Failed to create video");
  }
  return res
    .status(201)
    .json(new ApiResponse(201, "Video created successfully", newVideo));
});

export const incrementVideoViews = asyncHandler(async (req, res, next) => {
  const videoId = req.params.videoId;
  console.log('videoid',videoId);
  
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  await video.incrementViews();
  next();
});

const getVideoById = asyncHandler(async (req, res) => {
  // const { videoId } = req.params
  //TODO: get video by id
  const videoId = req.params.videoId;
  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId).populate(
    "owner",
    "username email avatar"
  );
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Video fetched successfully", video));
});

const updateVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
    //TODO: update video details like title, description, thumbnail
     const videoId = req.params?.videoId;
     const title = req.body?.title;
     const description = req.body?.description;
     const isPublished = req.body?.isPublished;
     const duration = parseFloat(req.body?.duration);
     const videoFile = req.files?.videoFile?.[0]?.path;
     const thumbnail = req.files?.thumbnail?.[0]?.path;

     if (!videoFile || !duration) {
       throw new ApiError(404, "All mendetary fields are required");
     }

     if (!mongoose.Types.ObjectId.isValid(videoId)) {
       throw new ApiError(400, "Invalid video ID");
     }
     const video = await Video.findById(videoId);
     if (!video) {
       throw new ApiError(404, "Video not found");
     }
     if (!video.validateUser(req.user._id)) {
       throw new ApiError(403, "You are not authorized to update this video");
     }

     // if (!videoFile || !thumbnail)
     //   throw new ApiError(500, "Error in uploading File");
     if (title) video.title = title;
     if (description) video.description = description;
     if (!isNaN(duration)) video.duration = duration;
     if (videoFile) {
       const videoCloudinaryData = await uploadOnCloudinary(videoFile);
       if (!videoCloudinaryData) {
         throw new ApiError(500, "error in uploading file on cloudinary");
       }
       const videoLink = videoCloudinaryData.url;
       const videoFilePublicId = videoCloudinaryData.public_id;
       const deletedFile = await DeleteFile(video.videoFilePublicId);
       // console.log('this deleted the video',deletedFile);

       if (!deletedFile) {
         throw new ApiError(500, "error in updating file on cloudinary");
       }
       video.videoFilePublicId = videoFilePublicId;
       video.videoFile = videoLink;
     }
     if (thumbnail) {
       const thumbnailCloudinaryData = await uploadOnCloudinary(thumbnail);
       if (!thumbnailCloudinaryData) {
         throw new ApiError(500, "error in uploading file on cloudinary");
       }
       const thumbnailLink = thumbnailCloudinaryData.url;
       const thumbnailPublicId = thumbnailCloudinaryData.public_id;
       const deletedFile = await DeleteFile(video.thumbnailPublicId);
       if (!deletedFile) {
         throw new ApiError(500, "error in updating file on cloudinary");
       }
       video.thumbnailPublicId = thumbnailPublicId;
       video.thumbnail = thumbnailLink;
     }
     if (typeof isPublished === "boolean") video.isPublished = isPublished;
     await video.save();
     return res
       .status(200)
       .json(new ApiResponse(200, "Video updated successfully", video));
});

const deleteVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
    //TODO: delete video
    const videoId = req.params.videoId;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(400, "Invalid video ID");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    if (!video.validateUser(req.user._id)) {
      throw new ApiError(403, "You are not authorized to delete this video");
    }
    //delete from Cloudinary
    const deletedVideoFile = await DeleteFile(video.videoFilePublicId);
    const deletedThumbnailFile = await DeleteFile(video.thumbnailPublicId);
    if (!deletedThumbnailFile || !deletedVideoFile) {
      throw new ApiError(501, "Failed to delete video");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);
    return res
      .status(200)
      .json(new ApiResponse(200, "Video deleted successfully", deletedVideo));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    // const { videoId } = req.params;
    const videoId = req.params.videoId;
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
      throw new ApiError(400, "Invalid video ID");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    console.log("user", req.user._id);
    if (!video.validateUser(req.user._id)) {
      throw new ApiError(403, "You are not authorized to update this video");
    }
    video.isPublished = !video.isPublished;
    await video.save();
    return res
      .status(200)
      .json(new ApiResponse(200, "Video publish status toggled", video));
});

export const getRandomVideos = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const videos = await Video.aggregate([
    { $match: { isPublished: true } },
    { $sample: { size: parseInt(limit, 10) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, "Random videos fetched successfully", videos));
});

export const getSubscribedVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: { path: "owner", select: "username email avatar" },
  };

  const result = await Subscription.aggregate(
    [
      { $match: { subscriber: userId } },
      {
        $lookup: {
          from: "videos",
          localField: "channel",
          foreignField: "owner",
          as: "videos",
          pipeline: [
            { $match: { isPublished: true } },
            { $sort: { createdAt: -1 } },
          ],
        },
      },
    ],
    options
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Subscribed videos fetched successfully", result)
    );
});

export const getTrendingVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { views: -1 },
    populate: { path: "owner", select: "username email avatar" },
  };
  const result = await Video.aggregatePaginate(
    [
      {
        $match: { isPublished: true },
      },
    ],
    options
  );
  return res
    .status(200)
    .json(new ApiResponse(200, "Trending videos fetched successfully", result));
});

export const searchVideos = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 10 } = req.query;
  if (!query) {
    throw new ApiError(400, "Search query is required");
  }
  // console.log('query',query);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
    populate: { path: "owner", select: "username email avatar" },
  };
  const result = await Video.aggregatePaginate(
    [
      {
        $match: { $text: { $search: query }, isPublished: true },
      },
    ],
    options
  );
  if (!result.docs[0]) throw new ApiError(404, "No Matches Found ");
  return res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", result));
});

export const getVideosByUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  const { page = 1, limit = 10 } = req.query;
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: { createdAt: -1 },
  };
  const result = await Video.aggregatePaginate(
    [{ $match: { owner: new mongoose.Types.ObjectId(userId) } }],
    options
  );
  if (!result.docs[0]) throw new ApiError(404, "No Video Found");
  return res
    .status(200)
    .json(new ApiResponse(200, "Videos fetched successfully", result));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
