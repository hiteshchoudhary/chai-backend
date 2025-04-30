import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const filter = {
        isPublished: true, 
    };
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } }, 
            { description: { $regex: query, $options: "i" } }, 
        ];
    }
    if (userId) {
        filter.owner = userId;
    }
    const sortOrder = sortType === "asc" ? 1 : -1;

    // Fetch videos with pagination, sorting, and filtering
    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortOrder }) // Sort by the specified field
        .skip((page - 1) * limit) // Skip documents for pagination
        .limit(parseInt(limit)); // Limit the number of documents

    // Count total videos for the given filter
    const totalVideos = await Video.countDocuments(filter);

    res.status(200).json({
        message: "Videos retrieved successfully",
        videos,
        metadata: {
            totalVideos,
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalVideos / limit),
        },
    });
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,videoFile,thumbnail} = req.body
    // TODO: get video, upload to cloudinary, create video
    const video = await Video.create({
        title,
        description,
        videoFile,
        thumbnail
    })
    res.status(200).json({
        message: "video published ",
        video: video
    })
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.findOne({
        _id: videoId
    })
    res.status(200).json({
        message: "video found",
        video : video
    })
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId,newtitle,newdesc,newthumb } = req.params
    //TODO: update video details like title, description, thumbnail
    const video = await Video.updateOne({
        _id: videoId
    },{
        title: newtitle ,
        description: newdesc,
        thumbnail: newthumb
    })
    res.status(200).json({
        message: "video updated",
        video: video
    })

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.deleteOne({
        _id: videoId
    })
    res.status(200).json({
        message: "video has been deleted",
        video: video
    })
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video =await Video.deleteOne({
        _id: videoId
    })
    if(video){
        await Video.deleteOne({
            _id: videoId
        })
        res.status(200).json({
            message: " video deleted "
        })
    }
    else{
      res.status(200).json({
        message: "video does not exist to remove it so publish a video "
      })
    }
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
