import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body
    if (!name.trim() || !description.trim()) {
        throw new ApiError(400, "All fields are required...");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?.id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, "playlist created successfully", playlist));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user id...");
    }
    const playlist = await Playlist.find({
        owner: userId,
    });

    if (playlist.length == 0) {
        throw new ApiError(404, "No playlist not found...");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "playlists fetched successfully", playlist));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
     if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist id...");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "playlist not found...");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "playlist fetched successfully", playlist));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: add video to playlist
    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playist id...");
    }

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id...");
    }

    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
        $push: {
            videos: videoId,
        },
        },
        {
        new: true,
        }
    );
    if (!updatePlaylist) {
        throw new ApiError(
        500,
        "Something went wrong while adding video to playlist..."
        );
    }

    return res
        .status(201)
        .json(
        new ApiResponse(201, "playlist updated successfully", updatePlaylist)
        );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(404, "Invalid playlist id...");
    }

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(404, "Invalid video id...");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
        $pull: {
            videos: new mongoose.Types.ObjectId(videoId),
        },
        },
        {
        new: true,
        }
    );

    if (!playlist) {
        throw new ApiError(
        400,
        "something went wrong while deleting videos from playlist..."
        );
    }

    return res
        .status(201)
        .json(
        new ApiResponse(201, "removed video from playlist successfully", playlist)
        );

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    // TODO: delete playlist
    if (!playlistId) {
        throw new ApiError(404, "invalid playlist id...");
    }

    const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);
    if (!deletePlaylist) {
        throw new ApiError(500, "playlist not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, "playlist deleted successfully..."));
    })

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(404, "Invalid playlist id...");
    }

    if (!name.trim() || !description.trim()) {
        throw new ApiError(400, "All fields are required...");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description,
            },
        },
        {
            new: true,
        }
    );
    if (!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res
        .status(200)
        .json(
        new ApiResponse(200, "playlist updated successfully", updatePlaylist)
        );
        
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