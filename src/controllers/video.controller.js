import { decode } from "jsonwebtoken"
import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"

const findCloudinaryPublicId = (url) => {
    const videoLinkSplit = url.split("/")
    const video_public_id = videoLinkSplit[videoLinkSplit.length - 1].split(".")[0]
    return video_public_id
}


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 4, query, sortBy, sortType, userId } = req.query

    

    // ?page=1&sortBy=views&sortType=asc&limit=4
    const parsedLimit = parseInt(limit);
    const pageSkip = (page - 1) * parsedLimit;
    const sortStage = {};
    sortStage[sortBy] = sortType === 'asc' ? 1 : -1;

    const allVideo = await Video.aggregate([
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
                as: "ownerResult",
                pipeline: [
                    
                    {
                        $project: {
                            userName: 1,
                            avatar: 1
                        }
                    }
                ]
            },

        },

        {
            $addFields: {
                owner_details: {
                    $arrayElemAt: ["$ownerResult", 0],
                },
            },
        },
        {
            $sort: sortStage
        },
        {
            $skip: pageSkip,
        },
        {
            $limit: parsedLimit,
        },
        {
            $project: {
                ownerResult: 0,
            }
        }

    ]
    )

    res
        .status(200)
        .json(new ApiResponse(200, allVideo, 'Success'))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    if (!(title && description)) {
        throw new ApiError(400, "title and description must be provided");
    }

    //* collect local path of files
    // const videoLocalPath = req.files?.videoFile[0]?.path;
    // const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    // if(!(videoLocalPath || thumbnailLocalPath)){
    //     throw new ApiError(400,"File not found");
    // } 
    // //* upload on cloudinary
    // const videoUploadOnCloudinaryResponse =  await uploadOnCloudinary(videoLocalPath);
    // const thumbnailUploadOnCloudinaryResponse = await uploadOnCloudinary(thumbnailLocalPath)
    // if(!(videoUploadOnCloudinaryResponse || thumbnailUploadOnCloudinaryResponse)){
    //     throw new ApiError(400,"something went wrong while uploading");
    // }


    const video = await Video.create({
        // videoFile : videoUploadOnCloudinaryResponse?.url || "",
        // thumbnail : thumbnailUploadOnCloudinaryResponse?.url || "",
        // duration: videoUploadOnCloudinaryResponse?.duration || 0,
        videoFile: "camera",
        thumbnail: "random",
        duration: 0,
        owner: req.user,
        title,
        description,

    })
    if (!video) {
        throw new ApiError(500, "Something went wrong while uploading")
    }

    res
        .status(200)
        .json(new ApiResponse(200, { video }, "video uploaded successfully"))


})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "id not found");
    }
    const video = await Video.findById(videoId).populate("owner");

    if (!video) {
        throw new ApiError(500, "something went wrong while getting video");
    }

    res
        .status(200)
        .json(new ApiResponse(200, { video }, "video finded successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = req.file?.path

    if (!videoId) {
        throw new ApiError(400, "id not found");
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(400, "something wrong happened while fetching video");
    }

    //* check you are the owner of this video or not
    if (!req.user._id.equals(video.owner._id)) {
        throw new ApiError(400, "you are not the owner of this video");
    }

    //* upload if data is available
    if (title) video.title = title;
    if (description) video.description = description;
    if (thumbnailLocalPath) {
        const newThumbnailURL = await uploadOnCloudinary(thumbnailLocalPath);
        if (!newThumbnailURL) {
            throw new ApiError(500, "something went wrong while uploading thumbnail");
        }
        await deleteOnCloudinary(video.thumbnail, 'image')
        video.thumbnail = newThumbnailURL;

    }

    await video.save({ validateBeforeSave: false })

    res
        .status(200)
        .json(new ApiResponse(200, { video }, 'Success'))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(400, "id not found");
    }

    const video = await Video.findByIdAndDelete(videoId)
    if (!video) {
        throw new ApiError(400, "something wrong happened while fetching video");
    }

    //* check you are the owner of this video or not
    if (!req.user._id.equals(video.owner._id)) {
        throw new ApiError(400, "you are not the owner of this video");
    }
    const videoFile = findCloudinaryPublicId(video.videoFile);
    const thumbnail = findCloudinaryPublicId(video.thumbnail);

    try {
        var deleteVideo = await deleteOnCloudinary(videoFile, 'video');
        var deleteThumbnail = await deleteOnCloudinary(thumbnail, 'image');
    } catch (error) {
        throw new ApiError(500, "Something went wrong while deleting data on cloudinary");
    }

    res
        .status(200)
        .json(new ApiResponse(200, { deleteVideo, deleteThumbnail }, "video delete successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "id not found");
    }

    const video = await Video.findById(videoId)
    console.log(video);
    if (!video) {
        throw new ApiError(400, "something wrong happened while fetching video");
    }

    //* check you are the owner of this video or not
    if (!req.user._id.equals(video.owner._id)) {
        throw new ApiError(400, "you are not the owner of this video");
    }

    video.isPublished = !video.isPublished;

    await video.save({ validateBeforeSave: false })

    res
        .status(200)
        .json(new ApiResponse(200, {}, "  successfully"));

})

export {
    deleteVideo, getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo
}

