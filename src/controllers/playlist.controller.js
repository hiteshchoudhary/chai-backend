import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {

    try {
        const { name, description } = req.body
        const creator = req.user.id;

        const newPlaylist = await Playlist.create({
            name,
            description,
            owner: creator,
            videos: [],
        });

        res.status(201).json(
            new ApiResponse(200, `${name} created`, newPlaylist)
        );
    } catch (error) {
        console.error("Error creating playlist:", error);
        res.status(500).json(
            new ApiError(500, "Internal Server Error")
        );
    }
})


const getUserPlaylists = asyncHandler(async (req, res) => {

    // for a given user => find all the playlists with given user as owner
    try {
        const { userId } = req.params

        if (!isValidObjectId(userId)) {
            return res.status(400).json({
                error: 'Invalid user ID',
            });
        }

        // Find playlists by the specified user ID
        const playlists = await Playlist.find({ owner: userId })
            .select('name description videos')
            .populate('videos', 'title')

        res.status(200).json(
            new ApiResponse(200, "Playlists retrieved:", playlists)
        );
    } catch (error) {
        console.error("Error while retrieving playlists:", error);
        res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
})


const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    try {

        if (!isValidObjectId(playlistId)) {
            return res.status(400).json({
                error: 'Invalid playlist ID',
            });
        }

        const playlist = await Playlist.findById({
            playlistId
        });

        // Check if the playlist exists
        if (!tweet) {
            throw new ApiError(404, "Playlist not found")
        }

        res.status(200).json(
            new ApiResponse(200, "Playlist retrieved:", playlist)
        );
    }
    catch (error) {
        console.error("Error while retrieving playlist:", error);
        res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;

        if (!isValidObjectId(playlistId)) {
            return res.status(400).json({
                error: 'Invalid playlist ID',
            });
        }

        if (!isValidObjectId(videoId)) {
            return res.status(400).json({
                error: 'Invalid video ID',
            });
        }

        // Find the playlist using ID
        const playlist = await Playlist.findById(playlistId);

        // Check if the playlist exists
        if (!playlist) {
            return res.status(404).json(
                new ApiResponse(404, "Playlist not found")
            );
        }

        playlist.videos.push(videoId);

        // Save the updated playlist into database
        await playlist.save();

        res.status(200).json(
            new ApiResponse(200, "Video added to playlist successfully", playlist)
        );
    } catch (error) {
        console.error("Error adding video to playlist:", error);
        res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist

    try {
        const { playlistId, videoId } = req.params;

        if (!isValidObjectId(playlistId)) {
            return res.status(400).json({
                error: 'Invalid playlist ID',
            });
        }

        if (!isValidObjectId(videoId)) {
            return res.status(400).json({
                error: 'Invalid video ID',
            });
        }

        // Find the playlist using ID
        const playlist = await Playlist.findById(playlistId);

        // Check if the playlist exists
        if (!playlist) {
            return res.status(404).json(
                new ApiResponse(404, "Playlist not found")
            );
        }

        // Check if the videoId exists in the videos array
        const videoIndex = playlist.videos.indexOf(videoId);
        if (videoIndex === -1) {
            return res.status(404).json(
                new ApiError(404, "Video not found in playlist")
            );
        }

        // Remove the video from the videos array of the playlist
        playlist.videos.splice(videoIndex, 1);


        // Save the updated playlist into database
        await playlist.save();

        res.status(200).json(
            new ApiResponse(200, "Video removed from playlist successfully", playlist)
        );
    } catch (error) {
        console.error("Error removed video from playlist:", error);
        res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        return res.status(400).json({
            error: 'Invalid playlist ID',
        });
    }

    try {
        const userId = req.user.id

        const playlist = await Playlist.findById(playlistId)

        // Check if the playlist exists
        if (!playlist) {
            throw new ApiError(404, "Playlist not found")
        }

        // Check if the authenticated user is the owner of the playlist
        if (playlist.owner.toString() !== userId) {
            return res.status(403).json(
                new ApiResponse(403, "Unauthorized: You are not the owner of this playlist!")
            );
        }

        // Delete the playlist
        await playlist.remove()

        return res.status(200).json(
            new ApiResponse(200, {}, "Playlist deleted successfully")
        );
    } catch (error) {
        console.error("Error deleting playlist:", error);
        return res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    const userId = req.user.id
 
    try {

        if (!isValidObjectId(playlistId)) {
            return res.status(400).json({
                error: 'Invalid playlist ID',
            });
        }
        
        const playlist = await Playlist.findById(playlistId);

        if (!playlist) {
            throw new ApiError(404, "Playlist not found")
        }

        // Check if the authenticated user is the owner of the playlist
        if (playlist.owner.toString() !== userId) {
            return res.status(403).json(
                new ApiResponse(403, "Unauthorized: You are not the owner of this playlist!")
            );
        }

        playlist.name = name
        playlist.description = description

        await playlist.save({ validateBeforeSave: false })

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Playlist details updated successfully"))
    } catch (error) {
        console.error("Error updating playlist:", error);
        return res.status(500).json(
            new ApiResponse(500, "Internal Server Error")
        );
    }
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
