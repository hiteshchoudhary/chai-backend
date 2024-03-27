import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(404, "name or description not founded");
    }

    //TODO: create playlist

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if (!playlist) {
        throw new ApiError(404, "Something went wrong in creating playlist");
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Successfully got the playlist"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "User id is not valid");
    }

    const pipeline = [
        {
            $match: {
                owner: userId
            }
        }
    ]

    const usersPlaylist = await Playlist.aggregate(pipeline);

    if (!usersPlaylist) {
        return res.status(200).json(
            new ApiResponse(200, usersPlaylist, "No playlist founded")
        )
    }



    return res.status(200).json(
        new ApiResponse(200, usersPlaylist, "Successfylly got the playlist")
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlist id is not a valid objectid");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "playlist not founded")
    }

    return res.status(200).json(new ApiResponse(200, playlist, "Successfylly got the playlist by Id"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params


    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "video or playlist id is not valid");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not founded");
    }

    const video = await Video.findById(videoId);
    if (!video || !video.isPublished) {
        throw new ApiError(400, "Video not founded");
    }

    playlist.videos.push(videoId)
    const updatedPlaylist = await playlist.save();

    if (!updatedPlaylist) {
        throw new ApiError(400, "playlist not updated");
    }

    return res.status(200).json(new ApiResponse(200, updatePlaylist, "Successfully added video to the playlist"))


})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "video or playlist id is not valid");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not founded");
    }

    const video = await Video.findById(videoId);
    if (!video || !video.isPublished) {
        throw new ApiError(400, "Video not founded");
    }

    playlist.videos.pull(videoId);
    const updatedPlaylist = await playlist.save();

    if (!updatedPlaylist) {
        throw new ApiError(400, "playlist not updated");
    }

    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Successfully remove video from the playlist"))



})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlist id is not valid");
    }

    const playlistDeleting = await Playlist.findByIdAndDelete(playlistId);

    if (!playlistDeleting) {
        throw new ApiError(400, "playlist does not deleted");
    }

    return res.status(200).json(new ApiResponse(200, playlistDeleting, "Successfully deleted the playlist"))


})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlist id is not valid");
    }

    if (!name || !description) {
        throw new ApiError(400, "name or description not founded");
    }

    const updatePlaylistDetails = await Playlist.findByIdAndUpdate(playlistId, {
        $set: {
            name,
            description
        }
    }, {
        new: true
    })

    if (!updatePlaylistDetails) {
        throw new ApiError(400, "Playlist Details are not updated");
    }


    return res.status(200).json(new ApiResponse(200, updatePlaylistDetails, "Successfully updated the playlist details"))


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
