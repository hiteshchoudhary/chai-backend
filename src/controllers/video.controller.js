import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    //TODO: get all videos based on query, sort, pagination
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    page = isNaN(page) ? 1 : Number(page);
    limit = isNaN(page) ? 10 : Number(limit);
  
    //because 0 is not accepatabl ein skip and limit in aggearagate pipelien
    if (page < 0) {
      page = 1;
    }
    if (limit <= 0) {
      limit = 10;
    }
  
    const matchStage = {};
    if (userId && isValidObjectId(userId)) {
      matchStage["$match"] = {
        owner: new mongoose.Types.ObjectId(userId),
      };
    } else if (query) {
      matchStage["$match"] = {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      };
    } else {
      matchStage["$match"] = {};
    }
    if (userId && query) {
      matchStage["$match"] = {
        $and: [
          { owner: new mongoose.Types.ObjectId(userId) },
          {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
            ],
          },
        ],
      };
    }
  
    const sortStage = {};
    if (sortBy && sortType) {
      sortStage["$sort"] = {
        [sortBy]: sortType === "asc" ? 1 : -1,
      };
    } else {
      sortStage["$sort"] = {
        createdAt: -1,
      };
    }
  
    const skipStage = { $skip: (page - 1) * limit };
    const limitStage = { $limit: limit };
  
    const videos = await Video.aggregate([
      matchStage,
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
        $lookup:{
          from:"likes",
          localField:"_id",
          foreignField:"video",
          as:"likes"
        }
      },
      sortStage,
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
          likes:{
            $size:"$likes"
          }
        },
      },
    ]);
  
    if (!videos) {
      throw new ApiError(404, "No videos found");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, videos, "video fetched successfully !"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title or description is required!!!");
  }

  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  const videoFileLocalPath = req.files?.videoFile[0].path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail file is required !");
  }
  if (!videoFileLocalPath) {
    throw new ApiError(400, "video file is required !");
  }

  const responseThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const responseVideoFile = await uploadOnCloudinary(videoFileLocalPath);

  if (!responseThumbnail && !responseThumbnail) {
    throw new ApiError(
      500,
      "could not upload video and thumbnail on cloudinary!"
    );
  }

  const video = await Video.create({
    title: title,
    description,
    videoFile: responseVideoFile.url,
    thumbnail: responseThumbnail.url,
    duration: responseVideoFile.duration,
    owner: new mongoose.Types.ObjectId(req.user?._id),
  });

  const newVideo = await Video.findById(video._id).select("-owner");

  if (!newVideo) {
    throw new ApiError(500, "something went wrong in publishing video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, newVideo, "video published succeessfully !"));
})

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    const { videoId } = req.params;
    if (!videoId.trim() || !isValidObjectId(videoId)) {
      throw new ApiError(400, "video id is invalid or requied");
    }
  
    let video = await Video.findById(videoId);
  
    if (!video) {
      throw new ApiError(404, "video not found");
    }
  
    video = await Video.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
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
                username: 1,
                fullname: 1,
                avatar: 1,
              },
            },
          ],
        },
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
          owner: {
            $first: "$owner",
          },
          likes: {
            $size: "$likes",
          },
        },
      },
      {
        $addFields: {
          views: {
            $add: [1, "$views"],
          },
        },
      },
    ]);
  
    if (video.length != 0) {
      video = video[0];
    }
    await Video.findByIdAndUpdate(videoId, {
      $set: {
        views: video.views,
      },
    });
  
    return res
      .status(200)
      .json(new ApiResponse(200, video, "vedio get succeessfully !"));
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params;
    const { title, description } = req.body;
  
    if (!videoId.trim() || !isValidObjectId(videoId)) {
      throw new ApiError(400, "video id is required or invalid !");
    }
  
    if (!title && !description) {
      throw new ApiError(400, "All fields are required");
    }
  
    const videoC = await Video.findById(videoId);
    if (!videoC) {
      throw new ApiError(404, "video not found !");
    }
  
    if (videoC.owner.toString() != (req.user?._id).toString()) {
      throw new ApiError(401, "Unauthorised user!");
    }
  
    const thumbnailLocalFilePath = req.file?.path;
  
    if (thumbnailLocalFilePath) {
      var response = await uploadOnCloudinary(thumbnailLocalFilePath);
      console.log(response);
      if (!response.url) {
        throw new ApiError(500, "error while uploadnig in cloudinray");
      }
    }
    const video = await Video.findById(videoId);
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        $set: {
          title,
          description,
          thumbnail: response?.url ? response.url : video.thumbnail,
        },
      },
      {
        new: true,
      }
    );
  
    if (!updatedVideo) {
      throw new ApiError(500, "error while updating video!");
    }
  
    const publicId = getPublicId(video.thumbnail);
    const deleteres = response?.url ? await deleteOnCloudinray(publicId) : null;
  
    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "update viodeo successfully !"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params;

  if (!videoId.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "video id is required or invalid !");
  }

  const videoC = await Video.findById(videoId);
  if (!videoC) {
    throw new ApiError(404, "video not found !");
  }

  if (videoC.owner.toString() != (req.user?._id).toString()) {
    throw new ApiError(401, "Unauthorised user!");
  }
  const deltedVideo = await Video.findByIdAndDelete(videoId);

  const thumbnailPublicId = getPublicId(deltedVideo.thumbnail);
  const videoPublicId = getPublicId(deltedVideo.videoFile);

  if (delResponse) {
    await Promise.all([
      Like.deleteMany({ video: _id }),
      Comment.deleteMany({ video: _id }),
      deleteOnCloudinray(videoPublicId, "video"),
      deleteOnCloudinray(thumbnailPublicId),
    ]);
  } else {
    throw new ApiError(500, "Something went wrong while deleting video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deltedVideo, "deleted successfully !"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
  if (!videoId.trim() || !isValidObjectId(videoId)) {
    throw new ApiError(400, "video id is required or invalid !");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found !");
  }

  if (video.owner.toString() != (req.user?._id).toString()) {
    throw new ApiError(401, "Unauthorised user!");
  }

  video.isPublished = !(video.isPublished);
  await video.save();

  return res.status(200).json(new ApiResponse(200, "toggled state of publish"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
