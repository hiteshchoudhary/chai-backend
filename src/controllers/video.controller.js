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
    const options = {
        page,
        limit
    }

    const aggregateOptions = [
        {
            $match: {
                $and: [
                    {
                        isPublished: true
                    },
                    {
                        $text: {
                            $search: query
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                score: {
                    $meta: "textScore"
                }
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{$first:"$owner"}
            }
        },
        {
            $sort:{
                score:-1,
                views:-1
            }
        }
    ]

    const videos = await Video.aggregate(aggregateOptions,options);

    if(!videos){
        throw new ApiError(500,"Something went wrong while fetching videos")
    }

    return res  
        .status(200)
        .json(
            new ApiResponse(200,videos,"Videos fetched successfully")
        )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title.trim() || !description.trim()){
        throw new ApiError(400,"Title and description i required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    const videoFileLocalPath = req.files?.videoFile[0].path;

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file is required !");
    }
    if (!videoFileLocalPath) {
        throw new ApiError(400, "video file is required !");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    const video = await uploadOnCloudinary(videoFileLocalPath);

    if (!video) {
        throw new ApiError(400, "video upload failed on cloudinary")
    }
    if (!thumbnail) {
        throw new ApiError(400, "thumbnail upload failed on cloudinary")
    }

    const uploadedVideo = await Video.create({
        title,
        description,
        videoFile: video.url,
        thumbnail: thumbnail.url,
        duration: video.duration,
        isPublished,
        owner: req.user?._id
    })

    if (!uploadedVideo) {
        throw new ApiError(500, "Something went wrong while create the video document")
    }

    return res.status(201).json(
        new ApiResponse(200, uploadedVideo, "video uploaded Successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"totalLikes"
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
            $addFields:{
                owner : {
                    $first :"$owner"
                },
                totalLikes:{
                    $size:"$totalLikes"
                },
                isLiked:{
                    $cond: {
                        if: {$in: [req.user?._id, "$totalLikes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                totalLikes:0
            }
        }
    ])

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc:{views:1}
        }
    )

    return res 
        .status(200)
        .json(
            new ApiResponse(200,updatedVideo,"Video fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description} = req.body;
    const thumbnailLocalPath = req.file?.path;
    const userId = req.user._id;

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "at list one field is required to update video");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(400, `video with the id ${videoId} is not found`);
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to update this video");
    }

    if(thumbnailLocalPath){
        const isThumbnailDeleted = await deleteFromCloudinary(video.thumbnail);
        if(!isThumbnailDeleted){
            throw new ApiError(500,"Error while deleting the thumbnail from cloudinary")
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if(!thumbnail){
            throw new ApiError(500,"Error uploading new thumbnail")
        }

        video.thumbnail=thumbnail.url;
    }

    video.description = description? description: video.description;
    video.title = title ? title : video.title;

    await video.save({validateBeforeSave:false})

    return res
        .status(200)
        .json(
            new ApiResponse(200,video,"Video updated successfully")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const userId = req.user._id;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to update this video");
    }

    const videoDeleted = await Video.findByIdAndDelete(videoId);
    if (!videoDeleted) {
        throw new ApiError(400, "Error while deleting the video from mongoDB");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, null, "Video deleted")
        )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to update publish status");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, `Video ${video.isPublished ? "published" : "unpublished"}`)
        );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
