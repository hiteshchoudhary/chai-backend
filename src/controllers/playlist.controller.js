import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create a playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    // Validate inputs
    if (!name || !description) {
        return res.status(400).json({ message: "Name and description are required" });
    }

    // Create the playlist
    const playlist = await Playlist.create({ name, description });

    res.status(201).json({
        message: "Playlist created successfully",
        playlist,
    });
});

// Get all playlists for a user
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Validate userId
    if (!isValidObjectId(userId)) {
        return res.status(400).json({ message: "Invalid userId" });
    }

    // Fetch playlists for the user
    const playlists = await Playlist.find({ owner: userId });

    res.status(200).json({
        message: "User playlists retrieved successfully",
        playlists,
    });
});

// Get a playlist by ID
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        return res.status(400).json({ message: "Invalid playlistId" });
    }

    // Fetch the playlist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({
        message: "Playlist retrieved successfully",
        playlist,
    });
});

// Add a video to a playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate inputs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        return res.status(400).json({ message: "Invalid playlistId or videoId" });
    }

    // Add the video to the playlist
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } }, // Prevent duplicate video entries
        { new: true } // Return the updated playlist
    );

    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({
        message: "Video added to playlist successfully",
        playlist,
    });
});

// Remove a video from a playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // Validate inputs
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        return res.status(400).json({ message: "Invalid playlistId or videoId" });
    }

    // Remove the video from the playlist
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } }, // Remove the videoId from the videos array
        { new: true } // Return the updated playlist
    );

    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({
        message: "Video removed from playlist successfully",
        playlist,
    });
});

// Delete a playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // Validate playlistId
    if (!isValidObjectId(playlistId)) {
        return res.status(400).json({ message: "Invalid playlistId" });
    }

    // Delete the playlist
    const playlist = await Playlist.findByIdAndDelete(playlistId);
    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({
        message: "Playlist deleted successfully",
        playlist,
    });
});

// Update a playlist
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;

    // Validate inputs
    if (!isValidObjectId(playlistId)) {
        return res.status(400).json({ message: "Invalid playlistId" });
    }

    // Update the playlist
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name, description },
        { new: true } // Return the updated playlist
    );

    if (!playlist) {
        return res.status(404).json({ message: "Playlist not found" });
    }

    res.status(200).json({
        message: "Playlist updated successfully",
        playlist,
    });
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
};
