import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc" } = req.query;

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const sortDirection = sortType === "asc" ? 1 : -1;

    const matchStage = query
        ? { title: { $regex: query, $options: "i" } }
        : {};

    const sortStage = {
        [sortBy]: sortDirection,
    };

    const aggregatePipeline = [
        { $match: matchStage },
        { $sort: sortStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel"
            }
        },
        {
            $unwind: "$channel",
        },
        {
            $project: {
                _id: 1,
                thumbnail: 1,
                title: 1,
                duration: 1,
                views: {
                    $cond: {
                        if: { $isArray: "$views" },
                        then: { $size: "$views" },
                        else: { $ifNull: ["$views", 0] }
                    }
                },
                isPublished: 1,
                "channel._id": 1,
                "channel.username": 1,
                "channel.avatar": 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ];

    const options = {
        page: pageNumber,
        limit: limitNumber,
    };

    const aggregate = Video.aggregate(aggregatePipeline);

    Video.aggregatePaginate(aggregate, options, (err, result) => {
        if (err) {
            throw new ApiError(400, err.message || "Failed to fetch videos");
        } else {
            return res.status(200).json(
                new ApiResponse(200, result, "All Videos Fetched Successfully.")
            );
        }
    });
});

const getAllUserVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    if (!userId) {
        throw new ApiError(400, "userId is required");
    }
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    page = parseInt(page);
    limit = parseInt(limit);

    const myAggregateVideos = Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel",
            },
        },
        { $unwind: "$channel" },
        {
            $match: {
                ...(query && { title: { $regex: query, $options: "i" } }),
            },
        },
        {
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1,
            },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
            $addFields: {
                views: {
                    $cond: {
                        if: { $isArray: "$views" },
                        then: { $size: "$views" },
                        else: { $ifNull: ["$views", 0] }
                    }
                }
            }
        },
        {
            $project: {
                "channel.email": 0,
                "channel.password": 0,
                "channel.refreshToken": 0,
                "channel.updatedAt": 0,
            }
        }
    ]);

    const result = await Video.aggregatePaginate(myAggregateVideos, { page, limit });

    return res
        .status(200)
        .json(new ApiResponse(200, result, "All User Videos with Channel Info"));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video

    /* 
        1. get the thumbnail and videofile name from multer.
        2. then, take the filePath and send it to cloudinary.
        3. extract the duration from the cloudinary output. 
        4. take the userId as owner.
        5. ignore for now: duration, views, isPublished.
        6. extract the duration from the cloudinary output.
        7. save all videoFile, thumbnail, owner, title, description.
    */

    if (!(title || description)) {
        throw new ApiError(400, "Title or Description is invalid")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    if (!videoLocalPath) {
        throw new ApiError(400, "Video path is required")
    }

    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!(videoFile || thumbnail)) {
        throw new ApiError("Error while uploading file on cloudinary")
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        title,
        description,
        duration: videoFile.duration
    })
    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video published successfully")
        )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!(videoId)) {
        throw new ApiError(400, "Video Id is invalid");
    }

    // Add user to views array only if not already present (unique view tracking)
    await Promise.all([
        Video.findByIdAndUpdate(
            videoId, 
            { $addToSet: { views: req.user._id } } // $addToSet ensures no duplicates
        ),
        User.findByIdAndUpdate(
            req.user._id,
            { $push: { watchHistory: videoId } }
        )
    ]);
    
    const video = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channel"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        { $unwind: "$channel" },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                views: {
                    $cond: {
                        if: { $isArray: "$views" },
                        then: { $size: "$views" },
                        else: { $ifNull: ["$views", 0] }
                    }
                },
                "channel.subscribersCount": { $size: "$subscribers" },
                "channel.isSubscribed": {
                    $cond: {
                        if: { $in: [new mongoose.Types.ObjectId(req.user._id), "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                "channel._id": 1,
                "channel.avatar": 1,
                "channel.fullName": 1,
                "channel.subscribersCount": 1,
                "channel.username": 1,
                "channel.isSubscribed": 1,

                createdAt: 1,
                description: 1,
                duration: 1,
                likesCount: 1,
                title: 1,
                videoFile: 1,
                views: 1,
                isPublished: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video Details Fetched Successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!videoId) {
        throw new ApiError(400, "Video Id is invalid")
    }

    const { title, description } = req.body;

    if (!(title || description)) {
        throw new ApiError(400, "Title or Description is invalid")
    }

    const thumbnailLocalPath = req.file?.path;
    const oldVideo = await Video.findById(videoId);
    const response = await deleteOnCloudinary(oldVideo);

    if (!response) {
        throw new ApiError(400, "Video deletion failed on cloudinary")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail: thumbnail.url
            }
        },
        { new: true }

    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video updated successfully")
        )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: delete video

    if (!videoId) {
        throw new ApiError(400, "Video Id is invalid")
    }

    const video = await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "Video is deleted successfully")
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "Video Id is invalid")
    }
    const video = await Video.findById(videoId);

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !(video.isPublished)
            }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, "Publish status toggled successfully")
        );

})

export {
    getAllVideos,
    getAllUserVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
