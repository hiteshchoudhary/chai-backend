import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    if (!(name || description)) throw new ApiError(400, "name or description is required");

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user
    })

    if (!playlist) throw new ApiError(500, "playlist is creating failed");


    res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    if (!userId) throw new ApiError(400, "userId required");

    const getUserPlaylists = await Playlist.find({ owner: userId });

    if (!getUserPlaylists) throw new ApiError(500, "playlists not found");

    res
        .status(200)
        .json(new ApiResponse(200, getUserPlaylists, "playlists found successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    if (!playlistId) throw new ApiError(400, "userId required");

    const getUserPlaylist = await Playlist.findById(playlistId);

    if (!getUserPlaylist) throw new ApiError(500, "playlists not found");

    res
        .status(200)
        .json(new ApiResponse(200, getUserPlaylist, "playlists found successfully"))


})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    if (!(playlistId || videoId)) throw new ApiError(400, "userId required");

    const videoAdded = await Playlist.findById(playlistId);

    //* find you are right owner or you are not
    if (videoAdded.owner !== req.user) {
        throw new ApiError(400, "you are not allowed to")
    }

    videoAdded.videos.push(videoId);


    try {
        await videoAdded.save({ validateBeforeSave: false });
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "something went wrong while saving video")
    }


    res
        .status(200)
        .json(new ApiResponse(200, videoAdded, "video added"))


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    const playlist = await Playlist.findById(playlistId);

    // Check if the playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the user is the owner of the playlist
    if (playlist.owner !== req.user) {
        throw new ApiError(403, "You are not allowed to remove videos from this playlist");
    }

    // Remove the video from the playlist's videos array
    playlist.videos = playlist.videos.filter(vid => vid !== videoId);

    // Save the updated playlist
    try {
        await playlist.save();
    } catch (error) {
        console.log(error);
        throw new ApiError(500, "something went wrong while saving video")
    }

    res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"));

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    const playlist = await Playlist.findById(playlistId);

    // Check if the playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the user is the owner of the playlist
    if (playlist.owner !== req.user) {
        throw new ApiError(403, "You are not allowed to remove videos from this playlist");
    }

    await playlist.remove();

    res.status(200).json(new ApiResponse(200, playlist, "playlist removed from database"));


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    const playlist = await Playlist.findById(playlistId);

    // Check if the playlist exists
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the user is the owner of the playlist
    if (playlist.owner !== req.user) {
        throw new ApiError(403, "You are not allowed to remove videos from this playlist");
    }

    // Update the playlist properties
    if (name) {
        playlist.name = name;
    }

    if (description) {
        playlist.description = description;
    }

    try {
        // Save the updated playlist
        await playlist.save();
    } catch (error) {
        throw new ApiError(503, `Something went wrong during save: ${error}`);
    }


    res.status(200).json(new ApiResponse(200, playlist, "playlist updated successfully"));

})

export {
    addVideoToPlaylist, createPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist, updatePlaylist
}

