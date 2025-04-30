import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all videos with pagination, sorting, and filtering
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    // Validate pagination inputs
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    if (pageNumber <= 0 || limitNumber <= 0) {
        return res.status(400).json({ message: "Page and limit must be positive integers" });
    }

    // Build the filter object
    const filter = { isPublished: true };
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
        ];
    }
    if (userId) {
        filter.owner = userId;
    }

    // Determine sort order
    const sortOrder = sortType === "asc" ? 1 : -1;

    // Fetch videos with pagination, sorting, and filtering
    const videos = await Video.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);

    // Count total videos for the given filter
    const totalVideos = await Video.countDocuments(filter);

    res.status(200).json({
        message: "Videos retrieved successfully",
        videos,
        metadata: {
            totalVideos,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalVideos / limitNumber),
        },
    });
});

// Publish a video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, videoFile, thumbnail } = req.body;

    // Validate inputs
    if (!title || !description || !videoFile || !thumbnail) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Create the video
    const video = await Video.create({ title, description, videoFile, thumbnail });

    res.status(201).json({
        message: "Video published successfully",
        video,
    });
});

// Get a video by ID
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    // Fetch the video
    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json({
        message: "Video retrieved successfully",
        video,
    });
});

// Update a video
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description, thumbnail } = req.body;

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    // Update the video
    const video = await Video.findByIdAndUpdate(
        videoId,
        { title, description, thumbnail },
        { new: true } // Return the updated document
    );
    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json({
        message: "Video updated successfully",
        video,
    });
});

// Delete a video
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    // Delete the video
    const video = await Video.findByIdAndDelete(videoId);
    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json({
        message: "Video deleted successfully",
        video,
    });
});

// Toggle publish status of a video
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        return res.status(400).json({ message: "Invalid video ID" });
    }

    // Fetch the video
    const video = await Video.findById(videoId);
    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }

    // Toggle the publish status
    video.isPublished = !video.isPublished;
    await video.save();

    res.status(200).json({
        message: `Video ${video.isPublished ? "published" : "unpublished"} successfully`,
        video,
    });
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};
