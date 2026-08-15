import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    if (!name || !description) {
        throw new ApiError(400, "Name and Description are required.")
    }

    const user = req.user._id

    const playlist = await Playlist.create({
        name: name,
        description: description,
        videos: [],
        owner: user
    })

    return res  
        .status(200)
        .json(new ApiResponse(200, playlist, "New playlist created"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if (!userId) {
        throw new ApiError(400, "User ID not found.")
    }

    const playlists = await Playlist.find({owner: userId})

    return res
        .status(200)
        .json(new ApiResponse(200, playlists, "User playlists fetched successfully."))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID.")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlst not found.")
    }
    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id) {
        throw new ApiError(403, "You are not authorized to modify this playlist.")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(401, "Video already exists in playlist.")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, 
        {
            $addToSet : { videos: videoId}
        },
        {
            new : true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const {playlistId, videoId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video not found")
    }
    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id) {
        throw new ApiError(403, "You are not authorized to modify this playlist.")
    }

    if (!(playlist.videos.includes(videoId))) {
        throw new ApiError(401, "Video doesn't exists in playlist.")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, 
        {
            $pull : { videos: videoId}
        },
        {
            new : true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    return res
        .status(200)
        .json(new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully."))    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID")
    }

    if (!name &&description) {
        throw new ApiError(400, "Name or Description is required")
    }

    const existingPlaylist = await Playlist.findById(playlistId)
    if (!existingPlaylist) {
        throw new ApiError(404, "Playlist not found")
    }
    if (existingPlaylist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You don't have permission to update this playlist")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId, 
        {
            $set: {
            name: name,
            description: description
        }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist updated successfully"))
    
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
