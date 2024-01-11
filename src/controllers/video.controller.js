import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  PublishAVideoBodySchema,
  UpdateAVideoBodySchema,
} from "../schema/video.schema.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId, Types } from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page, limit, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const { _id } = req.user;

  const sortObject = {};
  sortObject[`${sortBy ?? "createdAt"}`] = sortType === "asc" ? 1 : -1;

  const matchObject = {
    owner: new Types.ObjectId(userId),
  };

  if (query)
    matchObject["title"] = {
      $regex: query,
      $options: "i",
    };
  if (userId.toString() !== _id.toString()) matchObject["isPublished"] = true;

  const pageNumber = Number(page) ? Number.parseInt(page) : 1;
  const sizeLimit = Number(limit) ? Number.parseInt(limit) : 10;

  const videos = await Video.aggregate([
    {
      $match: matchObject,
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
              _id: 1,
              fullName: 1,
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
    {
      $sort: sortObject,
    },
    {
      $skip: (pageNumber - 1) * sizeLimit,
    },
    {
      $limit: sizeLimit,
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      videos,
    })
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const requestBodyValidationResult = PublishAVideoBodySchema.safeParse(
    req.body
  );

  if (!requestBodyValidationResult.success) {
    throw new ApiError(
      400,
      requestBodyValidationResult.error.errors[0]?.message,
      requestBodyValidationResult.error.errors.map((e) => e.message)
    );
  }

  const { description, title } = requestBodyValidationResult.data;

  const videoLocalPath = req.files["videoFile"][0]?.path;
  const thumbnailLocalPath = req.files["thumbnail"][0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "");
  }

  const videoThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const video = await uploadOnCloudinary(videoLocalPath);

  const newVideo = await Video.create({
    videoFile: video.url,
    thumbnail: videoThumbnail.url,
    title: title.trim(),
    description: description.trim(),
    duration: video.duration ?? 0,
    owner: _id,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      video: newVideo,
    })
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Provide a valid videoId", [
      "Provide a valid videoId",
    ]);
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(videoId),
      },
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
              _id: 1,
              fullName: 1,
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
  ]);

  if (video.length < 1) {
    throw new ApiError(404, "No such video found!!");
  }

  if (
    !video[0].isPublished &&
    video[0].owner._id.toString() !== _id.toString()
  ) {
    throw new ApiError(404, "No such video found!!");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      video: video[0],
    })
  );
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;

  // TODO: Fix oldThumbnail being saved issue!!

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Please provide a valid ObjectID", [
      "Please provide a valid ObjectID",
    ]);
  }

  const requestBodyValidationResult = UpdateAVideoBodySchema.safeParse(
    req.body
  );

  if (!requestBodyValidationResult.success) {
    throw new ApiError(
      400,
      requestBodyValidationResult.error.errors[0]?.message,
      requestBodyValidationResult.error.errors.map((e) => e.message)
    );
  }

  const requestBody = requestBodyValidationResult.data;
  const thumbnailLocalPath = req.file?.path;

  const updateObject = {};

  if (requestBody.title) updateObject["title"] = requestBody.title;
  if (requestBody.description)
    updateObject["description"] = requestBody.description;

  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    updateObject["thumbnail"] = thumbnail.url;
  }

  if (Object.keys(updateObject).length < 1) {
    throw new ApiError(400, "Please provide some fields to update");
  }

  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: _id,
    },
    [
      {
        $addFields: {
          oldThumbnail: "$thumbnail",
        },
      },
      {
        $set: updateObject,
      },
    ],
    {
      new: true,
    }
  ).lean();

  if (!updatedVideo) {
    if (updateObject["thumbnail"]) {
      const res = await deleteFromCloudinary(updateObject["thumbnail"], true);

      if (!res) console.log("Deletion failed!! you back and check!!");
    }

    throw new ApiError(
      404,
      "Either the video does not exist or you are not authorized"
    );
  }

  if (updateObject["thumbnail"]) {
    const res = await deleteFromCloudinary(updatedVideo.oldThumbnail, true);

    if (!res) console.log("Deletion failed!! you back and check!!");
  }

  updatedVideo["oldThumbnail"] = undefined;

  return res.status(200).json(
    new ApiResponse(200, {
      video: updatedVideo,
    })
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;

  const updatedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      owner: _id,
    },
    [
      {
        $set: {
          isPublished: {
            $eq: [false, "$isPublished"],
          },
        },
      },
    ],
    {
      new: true,
    }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "No such video found!!");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      publishedStatus: updatedVideo.isPublished,
    })
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
