import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFile, uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const sortOptions = {};

  if (sortBy) {
    sortOptions[sortBy] = sortType == "desc" ? -1 : 1;
  }

  let basequery = {};

  if (query) {
    basequery.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  try {
    const result = await Video.aggregate([
      {
        $match: {
          ...basequery,
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $sort: sortOptions,
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    console.log(result);

    return res.status(200).json(new ApiResponse(200, { result }, "Success"));
  } catch (e) {
    throw new ApiError(500, e.message);
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  try {
    const { title, description } = req.body;
    const userid = req.user._id;
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailFileLocalPath = req.files?.thumbnail?.[0]?.path;
    if (!videoFileLocalPath) throw new ApiError(400, "Video file required");
    if (!thumbnailFileLocalPath)
      throw new ApiError(400, "Thumbnail file required");
    const uploadVideoOnCloudinary =
      await uploadOnCloudinary(videoFileLocalPath);
    const uploadThubnailCloudinary = await uploadOnCloudinary(
      thumbnailFileLocalPath
    );

    if (!(uploadThubnailCloudinary || uploadVideoOnCloudinary))
      throw new ApiError(400, "Upload video error");
    const videoPublish = await Video.create({
      videoFile: uploadVideoOnCloudinary.url,
      thumbnail: uploadThubnailCloudinary.url,
      title,
      description,
      duration: uploadVideoOnCloudinary.duration,
      cloudinaryVideoID: uploadVideoOnCloudinary.public_id, //Adding these details to delete the video from the cloudinary also
      cloudinaryThumbnailID: uploadThubnailCloudinary.public_id,
      owner: userid,
    });
    if (!videoPublish)
      throw ApiError(500, "Something went wrong while uploading");
    return res
      .status(200)
      .json(new ApiResponse(200, { videoPublish }, "Success"));
  } catch (e) {
    throw new ApiError(400, e.message);
  }
});

const getVideoById = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoUrl = await Video.findById(videoId);
    if (!videoUrl) throw new ApiError(404, "Video not found");

    return res
      .status(200)
      .json(
        new ApiResponse(200, { videoUrl }, "Successfully retrieved Videos ")
      );
  } catch (e) {
    throw new ApiError(404, e.message);
  }
});

const updateVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const localFilePathofthumbnail = req.file.path;

    if (!localFilePathofthumbnail) {
      throw new ApiError(404, "File not found");
    }

    const uploadCloud = await uploadOnCloudinary(localFilePathofthumbnail);

    if (!uploadCloud.url) {
      throw new ApiError(500, "Unable to upload to cloud");
    }
    const public_id_video = await Video.findById(videoId);
    const deleteFileServer = await deleteFile(
      public_id_video.cloudinaryThumbnailID
    );
    const uploadfileonServer = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          thumbnail: uploadCloud.url,
          cloudinaryThumbnailID: uploadCloud.public_id,
          title: title,
          description: description,
        },
      },
      { new: true }
    );
    if (!uploadfileonServer)
      throw new ApiError(500, "Unable to update video on server");
    return res
      .status(200)
      .json(new ApiResponse(200, { uploadfileonServer }, "Success"));
    // Assuming deleteFile is a function you've defined elsewhere
  } catch (e) {
    throw new ApiError(500, "Error uploading: " + e.message);
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const public_id_video = await Video.findById(
      new mongoose.Types.ObjectId(videoId)
    );

    if (!public_id_video) {
      throw new ApiError(404, "Video not found");
    }

    const cloudinaryVideoID = public_id_video.get("cloudinaryVideoID");

    const deleteFileServer = await deleteFile(cloudinaryVideoID);

    if (!deleteFileServer.result || deleteFileServer.result !== "ok") {
      throw new ApiError(500, "Unable to delete file on Cloudinary");
    }

    const uploadfileonServer = await Video.findByIdAndDelete(videoId);

    if (!uploadfileonServer) {
      throw new ApiError(500, "Unable to delete video on server");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, { uploadfileonServer }, "Success"));
  } catch (e) {
    throw new ApiError(500, "Error deleting: " + e.message);
  }
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params;
    const video = await Video.findById(videoId);

    if (!video) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Video not found"));
    }

    const newPublishStatus = !video.isPublished;

    const toggle = await Video.findOneAndUpdate(
      { _id: videoId },
      { $set: { isPublished: newPublishStatus } },
      { new: true } // Update this code in commit 32
    );

    return res.status(200).json(new ApiResponse(200, { toggle }, "Updated"));
  } catch (e) {
    throw new ApiError(400, e.message || "Unable to update video");
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
