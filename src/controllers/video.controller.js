import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import {v2 as cloudinary} from "cloudinary"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination


})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished=true } = req.body

    if (
        [ title, description ].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //console.log(req.files);

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    

    if (!videoLocalPath) {
        throw new ApiError(400, "video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file is required")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!video) {
        throw new ApiError(400, "video upload failed on cloudinary")
    }
    
    if (!thumbnail) {
        throw new ApiError(400, "thumbnail upload failed on cloudinary")
    }

    const { duration } = await cloudinary.api.resource(video.public_id);

    // console.log(duration);

    const uploadedVideo = await Video.create({
        title:title,
        description:description,
        videoFile:video.url,
        thumbnail:thumbnail.url,
        duration:duration,
        isPublished:isPublished,
        owner:new mongoose.Types.ObjectId(req.user._id)
    })

    if (!uploadedVideo) {
        throw new ApiError(500, "Something went wrong while create the video document")
    }

    const createdVideo = await Video.findById(uploadedVideo._id);

    if (!createdVideo) {
        throw new ApiError(500, "Something went wrong while create the video document")
    }

    return res.status(201).json(
        new ApiResponse(200, createdVideo, "video uploaded Successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as: "owner",
                pipeline:[
                    {
                    $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "channel",
                        as: "subscribers"
                    }
                    },
                    {
                        $addFields:{
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project:{
                            fullName: 1,
                            username: 1,
                            subscribersCount: 1,
                            isSubscribed: 1,
                            avatar: 1,
                        }
                    }
                ]       
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"comments",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner"
                        }
                    },{
                        $addFields:{
                            owner:{$first:"$owner"}
                        }
                    },{
                        $project:{
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner : {
                    $first :"$owner"
                },
                totalComments:{
                    $size:"$comments"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video[0],
            "Video get successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const {title, description } = req.body;

    const thumbnailLocalPath = req.file?.path;

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "at list one field is required to update video");
    }

    const video = await Video.findById(videoId)
      
    if (!video) {
        throw new ApiError(400, `video with the id ${videoId} is not found`);
    }
    
    if (thumbnailLocalPath) {
        const isThumbnailDelete = await deleteFromCloudinary(video.thumbnail);

        if (!isThumbnailDelete) {
            throw new ApiError(400, "Error while deleting the thumbnail from cloudinary");
        }
    
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
        if (!thumbnail) {
            throw new ApiError(400, "Error while uploading thumbnail on cloudinary");
        }
        
            video.thumbnail = thumbnail.url;
            video.description = description? description : video.description;
            video.title = title? title : video.title;
    } else {
        video.description = description? description : video.description;
        video.title = title? title : video.title;
    }

    await video.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video updated successfully"
        )
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId); 

    if (!video) {
        throw new ApiError(400, `video with the id ${videoId} is not found`);
    }

    const isDeleted = await deleteFromCloudinary(video.videoFile); 

    if (!isDeleted) {
        throw new ApiError(400, "Error while deleting the video from cloudinary");
    }

    const videoDeleted = await Video.findByIdAndDelete(videoId);

    if (!videoDeleted) {
        throw new ApiError(400, "Error while deleting the video from mongoDB");
    }

    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Video Deleted successfully"
        )
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, `video with the id ${videoId} dose not exist`);
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Published Status chanced successfully"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
