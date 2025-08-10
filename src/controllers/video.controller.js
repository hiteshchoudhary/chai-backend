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
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
     const videolocalpath=req.files.videoFile[0].path;
    if(!videolocalpath) {
        throw new ApiError(400, "Video file is required")
    }

    const thumbnaillocalPath = req.files.thumbnail[0].path
    if(!thumbnaillocalPath) {
        throw new ApiError(400, "Thumbnail file is required")
    }
    const videofile=await uploadOnCloudinary(videolocalpath);
    const thumbnail=await uploadOnCloudinary(thumbnaillocalpath)
    if(!video){
        throw new ApiError(500, "Failed to upload video to cloudinary") 
    }
    const video=Video.create({
        videoFile: videofile.path,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videofile.duration,

    })
})

    return res.status(201).json({
        success: true,
        message: "Video published successfully",
        data: video,


})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

   
    //local path
    //chaeck local path exi
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
