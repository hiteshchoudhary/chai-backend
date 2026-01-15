import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import fs from "fs"

/**
 * Video Controller - Core functionality for video management
 * 
 * This controller handles all video-related operations including:
 * - Fetching videos with filtering, sorting, and pagination
 * - Publishing new videos
 * - Retrieving individual videos
 * - Updating video details
 * - Deleting videos
 * - Toggling publish status
 */

/**
 * getAllVideos - Get all videos with advanced filtering and pagination
 * 
 * Features:
 * - Pagination support (page, limit)
 * - Search query (searches in title and description)
 * - Filter by userId (channel videos)
 * - Sorting by various fields (views, createdAt, etc.)
 * - Only returns published videos by default
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Videos per page (default: 10)
 * - query: Search term for title/description
 * - sortBy: Field to sort by (views, createdAt, etc.)
 * - sortType: Sort order (asc: 1, desc: -1)
 * - userId: Filter videos by specific user/channel
 */
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    // Build match pipeline for filtering
    const matchStage = {
        isPublished: true // Only show published videos
    }

    // Add userId filter if provided
    if (userId && isValidObjectId(userId)) {
        matchStage.owner = new mongoose.Types.ObjectId(userId)
    }

    // Add search query if provided (search in title and description)
    if (query) {
        matchStage.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    // Build sort pipeline
    const sortStage = {}
    if (sortBy && sortType) {
        sortStage[sortBy] = sortType === "asc" ? 1 : -1
    } else {
        sortStage.createdAt = -1 // Default: newest first
    }

    // Use aggregate paginate for efficient pagination
    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortStage
    }

    // Aggregate pipeline to get videos with owner details
    const videos = await Video.aggregatePaginate(
        Video.aggregate([
            {
                $match: matchStage
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $project: {
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    owner: {
                        $first: "$owner"
                    }
                }
            },
            {
                $sort: sortStage
            }
        ]),
        options
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                videos,
                "Videos fetched successfully"
            )
        )
})

/**
 * publishAVideo - Upload and publish a new video
 * 
 * Process:
 * 1. Validate required fields (title, description)
 * 2. Check if video and thumbnail files are uploaded
 * 3. Upload video file to Cloudinary
 * 4. Upload thumbnail to Cloudinary
 * 5. Extract video duration from Cloudinary response
 * 6. Create video document in database
 * 7. Return created video
 * 
 * Required Files:
 * - videoFile: Video file (mp4, etc.)
 * - thumbnail: Thumbnail image
 * 
 * Required Body:
 * - title: Video title
 * - description: Video description
 */
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    // Validate required fields
    if (!title || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    // Check if video file is uploaded
    const videoFileLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required")
    }

    // Upload video to Cloudinary
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    if (!videoFile) {
        throw new ApiError(400, "Video file upload failed")
    }

    // Upload thumbnail to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload failed")
    }

    // Get video duration from Cloudinary response (in seconds)
    const duration = videoFile.duration || 0

    // Create video document
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration,
        owner: req.user._id
    })

    // Fetch created video with owner details
    const createdVideo = await Video.findById(video._id).populate(
        "owner",
        "username fullName avatar"
    )

    if (!createdVideo) {
        throw new ApiError(500, "Failed to create video")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdVideo,
                "Video published successfully"
            )
        )
})

/**
 * getVideoById - Get a single video by ID
 * 
 * Features:
 * - Increments view count when video is watched
 * - Populates owner information
 * - Adds video to user's watch history
 * 
 * Process:
 * 1. Validate videoId
 * 2. Find video and populate owner
 * 3. Increment view count
 * 4. Add to user's watch history (if authenticated)
 * 5. Return video details
 */
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Find video and populate owner details
    const video = await Video.findById(videoId).populate(
        "owner",
        "username fullName avatar"
    )

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Increment view count
    video.views += 1
    await video.save()

    // Add video to user's watch history (if not already present)
    if (req.user) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $addToSet: {
                    watchHistory: videoId
                }
            }
        )
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched successfully"
            )
        )
})

/**
 * updateVideo - Update video details (title, description, thumbnail)
 * 
 * Features:
 * - Only video owner can update
 * - Optional thumbnail update
 * - Validates video ownership before updating
 * 
 * Process:
 * 1. Validate videoId
 * 2. Check if video exists and user is owner
 * 3. Update title/description if provided
 * 4. Upload new thumbnail if provided
 * 5. Save updated video
 * 6. Return updated video
 */
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Find video and check ownership
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check if user is the owner
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own videos")
    }

    // Build update object
    const updateFields = {}
    if (title) updateFields.title = title
    if (description) updateFields.description = description

    // Handle thumbnail update if provided
    if (req.file?.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path)
        if (!thumbnail) {
            throw new ApiError(400, "Thumbnail upload failed")
        }
        updateFields.thumbnail = thumbnail.url
    }

    // Update video
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: updateFields
        },
        {
            new: true
        }
    ).populate("owner", "username fullName avatar")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video updated successfully"
            )
        )
})

/**
 * deleteVideo - Delete a video
 * 
 * Features:
 * - Only video owner can delete
 * - Validates ownership before deletion
 * 
 * Process:
 * 1. Validate videoId
 * 2. Check if video exists and user is owner
 * 3. Delete video from database
 * 4. Return success response
 * 
 * Note: Cloudinary files are not deleted here (can be added if needed)
 */
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Find video and check ownership
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check if user is the owner
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own videos")
    }

    // Delete video
    await Video.findByIdAndDelete(videoId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Video deleted successfully"
            )
        )
})

/**
 * togglePublishStatus - Toggle video publish status (published/unpublished)
 * 
 * Features:
 * - Only video owner can toggle
 * - Switches between published and unpublished states
 * 
 * Process:
 * 1. Validate videoId
 * 2. Check if video exists and user is owner
 * 3. Toggle isPublished status
 * 4. Return updated video
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    // Validate videoId
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Find video and check ownership
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check if user is the owner
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only toggle publish status of your own videos")
    }

    // Toggle publish status
    video.isPublished = !video.isPublished
    await video.save()

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                `Video ${video.isPublished ? 'published' : 'unpublished'} successfully`
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
