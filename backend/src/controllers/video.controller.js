import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  deleteVideoFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //TODO: get all videos based on query, sort, pagination
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    // userId,
  } = req.query; 

  // console.log("query is reaching the backend: ", req.query);

  const matchStage = {
    isPublished: true, // Only fetch published videos
    title: { $regex: query, $options: "i" },
  };
  
  // if(userId){
  //   if(!isValidObjectId(userId)) {
  //     throw new ApiError(400, "Invalid user id");
  //   }
  //   matchStage.owner = new mongoose.Types.ObjectId(userId);
  // }

  const totalVideos = await Video.countDocuments(matchStage);

  const pipeline = [
    // match stage for filtering
    { $match: matchStage },
    // lookup to fetch owner details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
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
    // sorting
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      }, 
    },
    // pagination
    { $skip: (parseInt(page) - 1) * parseInt(limit) },
    { $limit: parseInt(limit) },
  ];

  const videos = await Video.aggregate(pipeline);

  if (!videos?.length) {
    throw new ApiError(404, "No videos found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        totalVideos,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalVideos / limit),
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  // TODO: get video, upload to cloudinary, create video
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Give all details of the video");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  let videoFile;
  try {
    videoFile = await uploadOnCloudinary(videoFileLocalPath);
    console.log("uploaded video: ", videoFile);
  } catch (error) {
    console.log("Error uploading video ", error);
    throw new ApiError(500, "Failed to upload video");
  }

  let thumbnailFile;
  try {
    thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);
    console.log("uploaded thumbnail: ", thumbnailFile);
  } catch (error) {
    console.log("Error uploading thumbnail ", error);
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  try {
    const video = await Video.create({
      videoFile: videoFile.url,
      thumbnail: thumbnailFile.url,
      title,
      description,
      duration: videoFile.duration,
      owner: req.user._id,
    });

    if (!video) {
      throw new ApiError(500, "Something went wrong while uploading a video");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, video, "Video uploaded successfully"));
  } catch (error) {
    console.log("Error while uploading a video", error);

    if (videoFile) {
      await deleteFromCloudinary(videoFile.public_id);
    }

    if (thumbnailFile) {
      await deleteFromCloudinary(thumbnailFile.public_id);
    }

    throw new ApiError(
      500,
      "Something went wrong while uploading the video and video file and thumbnail deleted"
    );
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  //TODO: get video by id
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Give a valid video id");
  }

  let video = await Video.updateOne(
    { _id: new mongoose.Types.ObjectId(videoId) },
    { $inc: { views: 1 } }
  );

  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      }
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
              fullname: 1,
              username: 1,
              avatar: 1,
            }
          }
        ]
      }
    },
    {
      $lookup:{
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner._id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $addFields:{
        owner: {
          $first: "$owner"
        },
        likes: {
          $size: "$likes"
        },
        subscribers: {
          $size: "$subscribers"
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscribers.subscriber"]
            },
            then: true,
            else: false
          }
        },
        isLiked:{
          $cond: {
            if: {
              $in: [req.user?._id, "$likes.likedBy"]
            },
            then: true,
            else: false
          }
        }
      }
    }
  ]

  video = await Video.aggregate(pipeline);


  if (!video.length) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  //TODO: update video details like title, description, thumbnail
  const { videoId } = req.params;
  const { title, description } = req.body;
  const newThumbnailLocalPath = req.file?.path;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Give a valid video id");
  }

  if (!title || !description) {
    throw new ApiError(400, "Give all details of the video");
  }

  if (!newThumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // if (String(req.user._id) !== String(video.owner)) {
  //   throw new ApiError(403, "You not allowed to update the other's video");
  // }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to update another user's video"
    );
  }

  try {
    await deleteFromCloudinary(video.thumbnail);
  } catch (error) {
    throw new ApiError(500, "Error while deleting the previous thumbnail");
  }

  const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath);

  if (!newThumbnail.url) {
    throw new ApiError(400, "Error while uploading on thumbnail");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: newThumbnail.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Video id is required or invalid id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  // if (video.owner !== req.user._id) {
  //   throw new ApiError(400, "You are not allowed to delete this video");
  // }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to update another user's video"
    );
  }

  const deletedVideoFile = await deleteVideoFromCloudinary(video.videoFile);

  if (!deletedVideoFile || deletedVideoFile?.result !== "ok") {
    throw new ApiError(500, "Error while deleting video");
  }

  const deletedThumbnailFile = await deleteFromCloudinary(video.thumbnail);

  if (!deletedThumbnailFile || deletedThumbnailFile?.result !== "ok") {
    throw new ApiError(500, "Error while deleting thumbnail");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(500, "Error while deleting the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted Successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Video id is required");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to update another user's video"
    );
  }

  const videoPublishStatus = await Video.findByIdAndUpdate(
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
    .json(
      new ApiResponse(
        200,
        videoPublishStatus,
        "Video published status modified"
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
