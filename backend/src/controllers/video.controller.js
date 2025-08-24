import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
    search_field,
    search_value
  } = req.query;


  let match = {};
  if (userId) {
    match.owner = new mongoose.Types.ObjectId(userId);
  }
  if (search_field && search_value) {
    match[search_field] = { $regex: search_value, $options: "i" };
  }

  const aggregateQuery = Video.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "users",        
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails"
      }
    },
    { $unwind: "$ownerDetails" },
    {
      $project: {
        title: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        "ownerDetails.username": 1,
        "ownerDetails.email": 1
      }
    }
  ]);

  // 🔹 Step 3: Pagination options
  let options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { [sortBy]: sortType === "asc" ? 1 : -1 }
  };

  // 🔹 Step 4: Execute with aggregatePaginate
  const result = await Video.aggregatePaginate(aggregateQuery, options);

  return res.status(200).json(
    new ApiResponse(200, result, "Videos fetched successfully")

  );
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isShorts} = req.body
    console.log(title, description);
    
    if (!title && !description) {
        throw new ApiError(400, "title and description must feild")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!video && !thumbnail) {
        throw new ApiError(400, "something went wrong while uploading on cludinary")
    }

    const videoCreation = await Video.create({
        videoFile: video.url,
        title,
        description,
        thumbnail: thumbnail.url,
        isShorts,
        owner: req.author._id,
    })

    if (!videoCreation) {
        throw new ApiError(400, "something went wrong while vide creation") 
    }

    return res.status(200).json(
        new ApiResponse(200, videoCreation, "video created success")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "videoid is not there")
    }
    const videoById = await Video.findById( videoId );
    if (!videoById) {
        throw new ApiError(400, "video not found")
    }
    return res.status(200).json(
        new ApiResponse(200, videoById, "video fetched success")
    )
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description,  thumbnail} = req.body


    if (!title && !description && !thumbnail) {
    throw new ApiError(400, "Select at least one field to update");
    }

    const videoUpdation = await Video.findByIdAndUpdate(videoId, {
      title,
      description,
      thumbnail,
    });
    if (!videoUpdation) {
        throw new ApiError(400, "something went wrong while updating video"); 
    }
    return res.status(200).json(
        new ApiResponse(200, {"updateData": videoUpdation}, "video updated success")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "videoid is not there")
    }
    const videoDelete = await Video.findByIdAndDelete(videoId);
    if (!videoDelete) {
        throw new ApiError(400, "something went wrong while deleting video"); 
    }
    return res.status(200).json(
        new ApiResponse(200,  "video deleted success")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "videoid is not there")
    }
    const videoPublish = await Video.findByIdAndUpdate(videoId, {
      isPublished: !videoId.isPublished,
    })
    if (!videoPublish) {
        throw new ApiError(400, "something went wrong while updating video"); 
    }
    return res.status(200).json(
        new ApiResponse(200,  videoPublish,"video published status toggled success")
    )
})

const getShorts = asyncHandler(async (req,res) => {

    const shorts = await Video.find({isShorts:true}).populate("owner", "username avatar fullName").sort({createdAt: -1})
    if (shorts.length === 0) {
        throw new ApiError(400, "something wne twrong while getting the shorts")
    }
    return res.status(200).json(new ApiResponse(200, shorts, "fetched shorts data"))
})



const getVideoViews = asyncHandler(async (req,res) => {
  const {videoId} = req.params
  if (!videoId) {
    throw new ApiError(400, "videoid is not there")
  }
  const video = await Video.findById(videoId)
  if (!video) {
    throw new ApiError(400, "something went wrong while getting video views")
  }
  video.views += 1
  await video.save()
  return res.status(200).json(new ApiResponse(200, video, "fetched video views"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getShorts,
    getVideoViews,
}
