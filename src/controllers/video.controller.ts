import { Video } from "../models/video.models.ts";
import { Comment } from "../models/comment.models.ts";
import { Like } from "../models/like.models.ts";
import { Playlist } from "../models/playlist.models.ts";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import {
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  uploadOnCloudinary,
} from "../utils/cloudinary.ts";
import mongoose, { isValidObjectId } from "mongoose";
import { AuthenticatedRequest } from "./user.controller.ts";
import { Request, Response } from "express";

const isOwnerOfVideo = async (videoId: string, userId: string) => {
  try {
    const video = await Video.findById(videoId);

    if (!video) {
      throw new ApiError(404, "Video does not exist");
    }

    if (video?.owner.toString() !== userId.toString()) {
      return false;
    }

    return true;
  } catch (error: any) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
};

const getAllVideos = asyncHandler(async (req: Request, res: Response) => {
  let {
    page: pageNumber = 1,
    limit: limitNumber = 5,
    query,
    sortBy,
    sortType,
    userId,
  } = req.query;

  let page = isNaN(Number(pageNumber)) ? 1 : Number(pageNumber);
  let limit = isNaN(Number(limitNumber)) ? 5 : Number(limitNumber);

  if (page < 0) {
    page = 1;
  }

  if (limit <= 0) {
    limit = 5;
  }

  const matchStage: any = {};
  if (userId && isValidObjectId(userId as string)) {
    matchStage["$match"] = {
      "ownerInfo.owner_id": new mongoose.Types.ObjectId(userId as string),
    };
  } else if (query) {
    matchStage["$match"] = {
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { "ownerInfo.userName": { $regex: query, $options: "i" } },
      ],
    };
  } else {
    matchStage["$match"] = {};
  }

  if (userId && query) {
    matchStage["$match"] = {
      $and: [
        {
          "ownerInfo.owner_id": new mongoose.Types.ObjectId(userId as string),
        },
        {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { "ownerInfo.userName": { $regex: query, $options: "i" } },
          ],
        },
      ],
    };
  }

  const sortStage: any = {};
  if (sortBy && sortType) {
    sortStage["$sort"] = {
      [sortBy as string]: sortType === "asc" ? 1 : -1,
    };
  } else {
    sortStage["$sort"] = {
      createdAt: -1,
    };
  }

  try {
    const videos = await Video.aggregate([
      {
        $match: {
          isPublished: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      {
        $unwind: "$owner",
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      {
        $addFields: {
          likes: {
            $size: "$likes",
          },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          thumbnail: 1,
          views: 1,
          duration: 1,
          createdAt: 1,
          likes: 1,
          videoFile: 1,
          description: 1,
          ownerInfo: {
            owner_id: "$owner._id",
            userName: "$owner.userName",
            avatar: "$owner.avatar",
            fullName: "$owner.fullName",
          },
        },
      },
      matchStage,
      sortStage,
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $group: {
          _id: null,
          videos: {
            $push: "$$ROOT",
          },
        },
      },
      {
        $project: {
          _id: 0,
          videos: 1,
        },
      },
    ]);

    if (!videos || videos.length === 0) {
      throw new ApiError(404, "No videos found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, videos, "videos fetched successfully"));
  } catch (error: any) {
    throw new ApiError(
      500,
      error?.message || "Something went wrong while getting all videos"
    );
  }
});

const uploadVideo = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, description } = req.body;

    if ([title, description].some((field) => field.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    const videoFile = (
      req.files as { [fieldname: string]: Express.Multer.File[] }
    )?.videoFile;
    const thumbnailFile = (
      req.files as { [fieldname: string]: Express.Multer.File[] }
    )?.thumbnailFile;

    const videoLocalPath = videoFile && videoFile[0].path;
    const thumbnailLocalPath = thumbnailFile && thumbnailFile[0].path;

    if (!videoLocalPath) {
      throw new ApiError(400, "VideoFile is required");
    }

    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail is required");
    }
    try {
      const videoResponse = await uploadOnCloudinary(videoLocalPath);
      const thumbnailResponse = await uploadOnCloudinary(thumbnailLocalPath);

      if (!videoResponse || !thumbnailResponse) {
        throw new ApiError(500, "Error while uploading video");
      }

      const publishVideo = await Video.create({
        videoFile: videoResponse.url,
        thumbnail: thumbnailResponse.url,
        duration: videoResponse.duration,
        owner: req.user?._id,
        title,
        description,
      });

      if (!publishVideo) {
        throw new ApiError(500, "Something went wrong while publishing video");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, publishVideo, "video published successfully")
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "something went wrong while uploading video"
      );
    }
  }
);

const getVideoById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { videoId } = req.params;

    if (!videoId) {
      throw new ApiError(400, "videoId is required");
    }
    try {
      const video = await Video.findById(videoId);

      if (
        !video ||
        (!video?.isPublished &&
          !(video?.owner.toString() === req.user?._id.toString()))
      ) {
        throw new ApiError(404, "Video does not exist");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, video, "Successfully get video"));
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "Something went wrong while geting video by id"
      );
    }
  }
);

const updateVideo = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
      throw new ApiError(400, "videoid is required or invalid");
    }
    try {
      const authorized = await isOwnerOfVideo(videoId, req.user?._id);

      if (!authorized) {
        throw new ApiError(401, "Unauthorized Access");
      }

      const video = await Video.findById(videoId);

      if (!video) {
        throw new ApiError(404, "Video does not exist");
      }

      const { title, description } = req.body;

      if (!title || !description) {
        throw new ApiError(400, "Title or Description is required");
      }

      let updatedVideoData: {
        title: string;
        description: string;
        thumbnail?: string;
      } = {
        title: title,
        description: description,
      };

      const thumbnailFile = (
        req.files as { [fieldname: string]: Express.Multer.File[] }
      )?.thumbnailFile;

      const newThumbnailLocalPath = thumbnailFile && thumbnailFile[0].path;

      if (newThumbnailLocalPath) {
        const oldThumbnailFile = video.thumbnail;
        const publicId = await extractPublicIdFromUrl(oldThumbnailFile);
        await deleteFromCloudinary(publicId); // Delete old thumbnail from Cloudinary

        const newThumbnailResponse = await uploadOnCloudinary(
          newThumbnailLocalPath
        );
        if (!newThumbnailResponse?.url) {
          throw new ApiError(
            500,
            "Something went wrong while uploading thumbnail to Cloudinary"
          );
        }

        updatedVideoData.thumbnail = newThumbnailResponse.url;
      }

      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updatedVideoData },
        { new: true }
      );

      if (!updatedVideo) {
        throw new ApiError(
          500,
          "Something went wrong while updating video details"
        );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedVideo,
            "Video details updated successfully"
          )
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "Something went wrong while updating video"
      );
    }
  }
);

const deleteVideo = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { videoId } = req.params;

    if (!videoId || !isValidObjectId(videoId)) {
      throw new ApiError(400, "videoId is required or invalid");
    }

    try {
      const authorized = await isOwnerOfVideo(videoId, req.user?._id);

      if (!authorized) {
        throw new ApiError(300, "Unauthorized Access");
      }

      const videoDeleted = await Video.findByIdAndDelete(videoId);

      if (!videoDeleted) {
        throw new ApiError(500, "something went wrong while deleting video");
      }

      await Comment.deleteMany({ video: videoId });

      await Like.deleteMany({ video: videoId });

      const playlists = await Playlist.find({ video: videoId });

      for (const playlist of playlists) {
        await Playlist.findByIdAndUpdate(
          playlist._id,
          {
            $pull: { videos: videoId },
          },
          { new: true }
        );
      }

      return res
        .status(200)
        .json(new ApiResponse(200, videoDeleted, "Video deleted successfully"));
    } catch (error: any) {
      throw new ApiError(
        500,
        error.message || "something went wrong while deleting video"
      );
    }
  }
);

const togglePublishStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { videoId } = req.params;

    if (!videoId && !isValidObjectId(videoId)) {
      throw new ApiError(400, "videoId is required or invalid");
    }
    try {
      const video = await Video.findById(videoId);

      if (!video) {
        throw new ApiError(404, "Video not found");
      }

      const authorized = await isOwnerOfVideo(videoId, req.user?._id);

      if (!authorized) {
        throw new ApiError(300, "Unauthorized Access");
      }

      const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
          $set: {
            isPublished: !video.isPublished,
          },
        },
        { new: true }
      );

      if (!updatedVideo) {
        throw new ApiError(
          500,
          "Something went wrong while toggling publised status"
        );
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedVideo,
            "PublishStatus of the video is toggle successfully"
          )
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "Something went wrong while togglePublishStatus"
      );
    }
  }
);

export {
  getAllVideos,
  uploadVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
