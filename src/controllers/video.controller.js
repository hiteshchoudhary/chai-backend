import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // Define the query object based on the parameters
    const videoQuery = {};

    // If a search query is provided, match against title and description
    if (query) {
        videoQuery.$or = [
            { title: { $regex: query, $options: 'i' } }, // Case-insensitive search
            { description: { $regex: query, $options: 'i' } }
        ];
    }

    // If a userId is provided, filter videos by owner
    if (userId) {
        videoQuery.owner = userId;
    }

    const sortOptions = {};
    if (sortBy && sortType) {
        sortOptions[sortBy] = sortType === 'desc' ? -1 : 1;
    }

    const videos = await Video.aggregatePaginate(videoQuery, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortOptions
    });

    return res.status(201).json(
        new ApiResponse(200, videos, "Videos retrieved successfully..")
    );

});

const publishAVideo = asyncHandler(async (req, res) => {

    const { videoFile, thumbnail, title, description, duration} = req.body;

    try {
        // TODO: Upload video file and thumbnail to Cloudinary
        const videoFileUrl = await uploadOnCloudinary(videoFile);
        const thumbnailUrl = await uploadOnCloudinary(thumbnail);

        // TODO: Create a new video document in the database
        const newVideo = await Video.create({
            videoFile: videoFileUrl,
            thumbnail: thumbnailUrl,
            title,
            description,
            duration,
            owner: req.user.id,
        });

        return res.status(200).json(
            new ApiResponse(200, newVideo, 'Video published successfully')
        );
    } catch (error) {
        console.error("Error publishing video:", error);
        return res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    try {

        if (!isValidObjectId(videoId)) {
            return res.status(400).json({
                error: 'Invalid Video ID',
            });
        }

        const video = await Video.findById({
            videoId
        });

        // Check if the video exists
        if (!video) {
            throw new ApiError(404, "Video not found")
        }

        res.status(200).json(
            new ApiResponse(200, "Video retrieved:", video)
        );
    }
    catch (error) {
        console.error("Error while retrieving Video:", error);
        res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId, title, description, thumbnail, userId } = req.params
    //TODO: update video details like title, description, thumbnail

    try {

        if (!isValidObjectId(videoId)) {
            return res.status(400).json({
                error: 'Invalid Video ID',
            });
        }

        const video = await Video.findById(videoId);

        if (!video) {
            throw new ApiError(404, "Video not found")
        }

        // Check if the authenticated user is the owner of the video
        if (video.owner.toString() !== userId) {
            return res.status(403).json(
                new ApiResponse(403, "Unauthorized: You are not the owner of this video!")
            );
        }

        const thumbnailUrl = await uploadOnCloudinary(thumbnail);

        video.title = title
        video.description = description
        video.thumbnail = thumbnailUrl;

        await video.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Video details updated successfully"))

    } catch (error) {
        console.error("Error updating Video:", error);
        return res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        return res.status(400).json({
            error: 'Invalid video ID',
        });
    }

    try {
        const userId = req.user.id

        const video = await Video.findById(videoId)

        // Check if the playlist exists
        if (!video) {
            throw new ApiError(404, "Video not found")
        }

        if (video.owner.toString() !== userId) {
            return res.status(403).json(
                new ApiResponse(403, "Unauthorized: You are not the owner of this Video!")
            );
        }

        await video.remove()

        return res.status(200).json(
            new ApiResponse(200, {}, "Video deleted successfully")
        );
    } catch (error) {
        console.error("Error deleting Video:", error);
        return res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: 'Video not found',
            });
        }

        video.isPublished = !video.isPublished;

        await video.save();

        res.status(200).json(
            new ApiResponse(200, `Publish status toggled successfully. New status: ${video.isPublished ? 'Published' : 'Unpublished'}`, video)
        );
    }catch (error) {
        console.error("Error while toggling Video publish status:", error);
        res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
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
