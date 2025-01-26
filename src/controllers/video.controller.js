import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;
    const filters = {};
    if(query) filters.title = { $regex: query, $options: "i" }
    if (userId && isValidObjectId(userId)) filters.owner = userId

    const sortOptions = { [sortBy]: sortType === "desc" ? -1 : 1 }

    const videos = await Video.find(filters)
                            .sort(sortOptions)
                            .skip((page - 1) * limit)
                            .limit(limit)
                            .populate("owner")

    const totalVideos = await Video.countDocuments(filters)

    const response = new ApiResponse(200, { videos, totalVideos })
    res.status(200).json(response)
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    const userId = req.user._id;

    if(!title || !description) {
        return next(new ApiError(400, "Title and description are required"))
    }

    if(!req.file) {
        return next(new ApiError(400, "Video file is required"))
    }

    const uploadedVideo = await uploadOnCloudinary(req.file.path, "video");
    if(!uploadedVideo) {
        return next(new ApiError(500, "Error uploading video"))
    }

    const uploadedThumbnail = await uploadOnCloudinary(req.file.path, "image");
    if(!uploadedThumbnail) {
        return next(new ApiError(500, "Error uploading thumbnail"))
    }


    const newVideo = new Video({
        title,
        description,
        videoFile: uploadedVideo.secure_url,
        thumbnail: uploadedVideo.thumbnail_url,
        duration: uploadedVideo.duration,
        owner: userId
    })

    await newVideo.save();

    const response = new ApiResponse(201, newVideo)
    res.status(201).json(response)
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
        return next(new ApiError(400, "Invalid video id"))
    }

    const video = await Video.findById(videoId);
    if(!video) {
        return next(new ApiError(404, "Video not found"))
    }

    const response = new ApiResponse(200, video)
    res.status(200).json(response)
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description, thumbnail } = req.body

    if(!isValidObjectId(videoId)) {
        return next(new ApiError(400, "Invalid video id"))
    }

    const updatedFields = {};
    if(title) updatedFields.title = title
    if(description) updatedFields.description = description

    if(req.file && thumbnail) {
        const uploadedThumbnail = await uploadOnCloudinary(req.file.path, "image");
        if(!uploadedThumbnail) {
            return next(new ApiError(500, "Error uploading thumbnail"))
        }

        updatedFields.thumbnail = uploadedThumbnail.secure_url
        updatedFields.thumbnailPublicId = uploadResult.public_id;

        const updatedVideo = await Video.findByIdAndUpdate(videoId, updatedFields, {new: true})
        if(!updatedVideo) {
            return next(new ApiError(404, "Video not found"))
        }

        const response = new ApiResponse(200, updatedVideo)
        res.status(200).json(response)
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
        return next(new ApiError(400, "Invalid video id"))
    }

    const video = Video.findById(videoId);
    if(!video) {
        return next(new ApiError(404, "Video not found"))
    }

    await uploadOnCloudinary.destroy(video.public_id);
    await video.remove();

    const response = new ApiResponse(200, "Video deleted successfully")
    res.status(200).json(response)
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!isValidObjectId(videoId)) {
        return next(new ApiError(400, "Invalid video id"))
    }

    const video = Video.findById(videoId);
    if(!video) {
        return next(new ApiError(404, "Video not found"))
    }

    video.isPublished = !video.isPublished;
    await video.save();

    const response = new ApiResponse(200, video)
    res.status(200).json(response)
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
