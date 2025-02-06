import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
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
      userId,
    } = req.query;
    //TODO: get all videos based on query, sort, pagination
  
    if (!req.user) {
      throw new ApiError(401, "User needs to be logged in");
    }
  
    const match = {
      ...(query ? { title: { $regex: query, $options: "i" } } : {}),
      ...(userId ? { owner: mongoose.Types.ObjectId(userId) } : {}),
    };
  
    const videos = await Video.aggregate([
      {
        $match: match,
      },
  
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "videosByOwner",
        },
      },
  
      {
        $project: {
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          isPublished: 1,
          owner: {
            $arrayElemAt: ["$videosByOwner", 0],
          },
        },
      },
  
      {
        $sort: {
          [sortBy]: sortType === "desc" ? -1 : 1,
        },
      },
  
      {
        $skip: (page - 1) * parseInt(limit),
      },
  
      {
        $limit: parseInt(limit),
      },
    ]);
  
    if (!videos?.length) {
      throw new ApiError(404, "Videos are not found");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, videos, "Videos fetched successfully"));
  });


const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, owner, duration } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if(!title) {
    throw new ApiError(400, "Title should not be empty")
  }
  if(!description) {
    throw new ApiError(400, "Description should not be empty")
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required")
 }

 const thumbnailLocalPath = req.files?.thumbnail[0]?.path

 if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required")
 }

 const videoFile = await uploadOnCloudinary(videoFileLocalPath)
 const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

 if (!videoFile) {
    throw new ApiError(400, "Cloudinary Error:  Video file is required")
}

if (!thumbnail) {
    throw new ApiError(400, "Cloudinary Error: Thumbnail is required")
 }

 const videoDoc = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    owner: req.user?._id,
    duration,
 })

 console.log(` Title: ${title}, Owner: ${owner}, duration: ${duration}`);
 

 if (!videoDoc) {
    throw new ApiError(500, "Something went wrong while publishing a video")
}

return res
    .status(201)
    .json(new ApiResponse(201, videoDoc, "Video published Successfully"));
  

});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  
  // Validate if the provided videoId is a valid MongoDB ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  
  // Find the video by ID and populate owner details
  const video = await Video.findById(videoId).populate("owner", "name email");
  
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  
  return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});


const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  // Validate if the provided videoId is a valid MongoDB ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  let updateData = { title, description };

  // Handle thumbnail update
  if (req.file) {
    const thumbnailLocalPath = req.file.path;
    
    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file is missing");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
    if (!thumbnail.url) {
      throw new ApiError(400, "Error while uploading thumbnail");
    }



    updateData.thumbnail = thumbnail.url;
  }

  // Find and update the video
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate if the provided videoId is a valid MongoDB ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  
  // Find and delete the video
  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(404, "Video not found");
  }
  
  return res.status(200).json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate if the provided videoId is a valid MongoDB ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  
  // Find the video
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  
  // Toggle the published status
  video.isPublished = !video.isPublished;
  await video.save();

  return res.status(200).json(new ApiResponse(200, video, "Video publish status toggled successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
