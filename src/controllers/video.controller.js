import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    let filter={}
    let option={
        limit,
        skip:(page-1)*limit
    }
    if (query){
        filter.$or=[
        {
            title:{$regex:/query/i}
        }
        {
            description:{regex:/query/i}
        }
        ]
    }
    if(userId){
        filter.owner=userId
    }

    if(Object.Keys(filter).length===0){
        throw ApiError(400,"query must be requried")
    }

    const allVideos= await Video.find(filter,null,option)?.sort({sortBy:sortType})?.toArray()
    if(!allVideos){
        throw ApiError(401,"videos not found")
    }

   return res.status(201).json(
    ApiResponse(200,allVideos,"videos found sucessfully")

    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw ApiError(409,"title and description must be requried")
    }

    



})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
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
