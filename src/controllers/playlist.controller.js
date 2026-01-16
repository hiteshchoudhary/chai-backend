import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body;
    console.log(req.body);
    //TODO: create playlist
    const playlist=await Playlist.create(
        {
            name:name,
            description:description,
            owner:req.user._id
        }
    ).populate({
        path:"videos",
        select:"title thumbnail owner",
        populate:{
            path:"owner",
            select:"username"
        }
    }).populate("owner","username email");
    return res.status(200).json(new ApiResponse(200,playlist,"playlist built successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const playlists=await Playlist.find(
        {
            owner:userId
        }
    ).populate("owner","username email");
     res.status(200).json(new ApiResponse(200,playlists,"user playlists retrieved successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const playlist=await Playlist.findById(playlistId)
    .populate({
        path:"videos",
        select:"title thumbnail owner",
        populate:{
            path:"owner",
            select:"username"
        }
    }).populate("owner","username email");
     res.status(200).json(new ApiResponse(200,playlist,"playlist retrieved successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId){
        throw new ApiError(400,"playlistId and videoId are required");
    }
    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos:videoId
            }
        },
        {
            new:true
        }
    ).populate({
        path:"videos",
        select:"title thumbnail owner",
        populate:{
            path:"owner",
            select:"username"
        }
    }).populate("owner","username email");
    if(!updatePlaylist){
        throw new ApiError(405,"playlist could not be updated");
    }
    res.status(200).json(new ApiResponse(200,updatedPlaylist,"added video to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos:videoId
            }
        },
        {
            new:true
        }
    ).populate({
        path:"videos",
        select:"title thumbnail owner",
        populate:{
            path:"owner",
            select:"username"
        }
    }).populate("owner","username email");
     res.status(200).json(new ApiResponse(200,updatedPlaylist,"deleted video from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const deletedPlaylist=await Playlist.findByIdAndDelete(
        playlistId
    ).populate({
        path:"videos",
        select:"title thumbnail owner",
        populate:{
            path:"owner",
            select:"username"
        }
    }).populate("owner","username email");
     res.status(200).json(new ApiResponse(200,deletedPlaylist,"deleted playlist successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name:name,
            description:description
        },
        {new:true}
    ).populate({
        path:"videos",
        select:"title thumbnail owner",
        populate:{
            path:"owner",
            select:"username"
        }
    }).populate("owner","username email");
     res.status(200).json(new ApiResponse(200,updatedPlaylist,"updated playlist successfully"))
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
