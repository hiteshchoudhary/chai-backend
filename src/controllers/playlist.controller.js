import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

/**
 * Playlist Controller - Handles playlist management operations
 * 
 * This controller manages video playlists including:
 * - Creating playlists
 * - Getting user playlists
 * - Getting playlist details
 * - Adding/removing videos from playlists
 * - Updating playlist details
 * - Deleting playlists
 */

/**
 * createPlaylist - Create a new playlist
 * 
 * Features:
 * - Validates required fields (name, description)
 * - Associates playlist with current user
 * - Creates empty playlist (videos can be added later)
 * 
 * Process:
 * 1. Validate name and description
 * 2. Create playlist document
 * 3. Return created playlist
 * 
 * Required Body:
 * - name: Playlist name
 * - description: Playlist description
 */
const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    // Validate required fields
    if (!name || !description) {
        throw new ApiError(400, "Name and description are required")
    }

    // Create playlist
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id,
        videos: [] // Start with empty videos array
    })

    // Fetch created playlist with owner details
    const createdPlaylist = await Playlist.findById(playlist._id).populate(
        "owner",
        "username fullName avatar"
    )

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdPlaylist,
                "Playlist created successfully"
            )
        )
})

/**
 * getUserPlaylists - Get all playlists created by a user
 * 
 * Features:
 * - Returns all playlists for a specific user
 * - Includes playlist owner details
 * - Shows video count in each playlist
 * 
 * Process:
 * 1. Validate userId
 * 2. Find all playlists owned by user
 * 3. Populate owner information
 * 4. Return playlists list
 */
const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    // Validate userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    // Find all playlists owned by user
    const playlists = await Playlist.find({
        owner: userId
    }).populate("owner", "username fullName avatar")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlists,
                "User playlists fetched successfully"
            )
        )
})

/**
 * getPlaylistById - Get a specific playlist by ID with all video details
 * 
 * Features:
 * - Returns playlist with all videos populated
 * - Includes video owner information
 * - Shows complete playlist structure
 * 
 * Process:
 * 1. Validate playlistId
 * 2. Find playlist and populate videos
 * 3. Populate video owners
 * 4. Return playlist with full details
 */
const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // Find playlist and populate videos with their owners
    const playlist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            populate: {
                path: "owner",
                select: "username fullName avatar"
            }
        })
        .populate("owner", "username fullName avatar")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlist,
                "Playlist fetched successfully"
            )
        )
})

/**
 * addVideoToPlaylist - Add a video to a playlist
 * 
 * Features:
 * - Only playlist owner can add videos
 * - Prevents duplicate videos in playlist
 * - Validates video exists
 * 
 * Process:
 * 1. Validate playlistId and videoId
 * 2. Check if playlist exists and user is owner
 * 3. Check if video exists
 * 4. Check if video already in playlist
 * 5. Add video to playlist
 * 6. Return updated playlist
 */
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    // Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    // Find playlist and check ownership
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only add videos to your own playlists")
    }

    // Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Check if video already in playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already exists in playlist")
    }

    // Add video to playlist
    playlist.videos.push(videoId)
    await playlist.save()

    // Fetch updated playlist with video details
    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            populate: {
                path: "owner",
                select: "username fullName avatar"
            }
        })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video added to playlist successfully"
            )
        )
})

/**
 * removeVideoFromPlaylist - Remove a video from a playlist
 * 
 * Features:
 * - Only playlist owner can remove videos
 * - Validates video exists in playlist
 * 
 * Process:
 * 1. Validate playlistId and videoId
 * 2. Check if playlist exists and user is owner
 * 3. Check if video exists in playlist
 * 4. Remove video from playlist
 * 5. Return updated playlist
 */
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    // Validate IDs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    // Find playlist and check ownership
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only remove videos from your own playlists")
    }

    // Check if video exists in playlist
    if (!playlist.videos.includes(videoId)) {
        throw new ApiError(404, "Video not found in playlist")
    }

    // Remove video from playlist
    playlist.videos = playlist.videos.filter(
        id => id.toString() !== videoId
    )
    await playlist.save()

    // Fetch updated playlist
    const updatedPlaylist = await Playlist.findById(playlistId)
        .populate({
            path: "videos",
            populate: {
                path: "owner",
                select: "username fullName avatar"
            }
        })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "Video removed from playlist successfully"
            )
        )
})

/**
 * deletePlaylist - Delete a playlist
 * 
 * Features:
 * - Only playlist owner can delete
 * - Validates ownership before deletion
 * 
 * Process:
 * 1. Validate playlistId
 * 2. Check if playlist exists and user is owner
 * 3. Delete playlist
 * 4. Return success response
 */
const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // Find playlist and check ownership
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own playlists")
    }

    // Delete playlist
    await Playlist.findByIdAndDelete(playlistId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Playlist deleted successfully"
            )
        )
})

/**
 * updatePlaylist - Update playlist name and description
 * 
 * Features:
 * - Only playlist owner can update
 * - Updates name and/or description
 * - Validates ownership before updating
 * 
 * Process:
 * 1. Validate playlistId
 * 2. Check if playlist exists and user is owner
 * 3. Validate at least one field to update
 * 4. Update playlist
 * 5. Return updated playlist
 * 
 * Required Body (at least one):
 * - name: Updated playlist name
 * - description: Updated playlist description
 */
const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    // Find playlist and check ownership
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only update your own playlists")
    }

    // Build update object
    const updateFields = {}
    if (name) updateFields.name = name.trim()
    if (description) updateFields.description = description.trim()

    // Check if at least one field is provided
    if (Object.keys(updateFields).length === 0) {
        throw new ApiError(400, "At least one field (name or description) is required")
    }

    // Update playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
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
                updatedPlaylist,
                "Playlist updated successfully"
            )
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
