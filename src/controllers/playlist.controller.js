import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    try{
        const {name, description, videos} = req.body;
        const userId = req.user._id;

        const newPlaylist = new Playlist({
            name,
            description,
            videos,
            owner: userId
        })

        await newPlaylist.save();
        res.status(201).json(new ApiResponse(201, newPlaylist))
    } catch(error){
        next(new ApiError(500, error.message))
    }

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    try{
        const {userId} = req.params;
        const playlists = await Playlist.find({owner: userId});

        if(!playlists){
            next(new ApiError(404, "No playlists found"))
        }

        next(new ApiResponse(200, playlists))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const getPlaylistById = asyncHandler(async (req, res) => {
    try{
        const {playlistId} = req.params
        const playlist = await Playlist.findById(playlistId);

        if(!playlist){
            next(new ApiError(404, "Playlist not found"))
        }

        next(new ApiResponse(200, playlist))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    try{
        const {playlistId, videoId} = req.params;
        const userId = req.user._id;
        
        const playlist = await Playlist.findOne({_id: playlistId, owner: userId});
        if(!playlist){
            next(new ApiError(404, "Playlist not found"))
        }

        const video = await Video.findById(videoId);
        if(!video){
            next(new ApiError(404, "Video not found"))
        }

        playlist.videos.push(videoId);
        await playlist.save();

        next(new ApiResponse(200, playlist))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    try{
        const {playlistId, videoId} = req.params;
        const userId = req.user._id;
        
        const playlist = await Playlist.findOne({_id: playlistId, owner: userId});
        if(!playlist){
            next(new ApiError(404, "Playlist not found"))
        }

        const videoIndex = await playlist.videos.indexOf(videoId);
        if(videoIndex === -1){
            next(new ApiError(404, "Video not found"))
        }

        playlist.videos.splice(videoIndex, 1);
        await playlist.save();

        next(new ApiResponse(200, playlist))
    } catch(error){
        next(new ApiError(500, error.message))
    }

})

const deletePlaylist = asyncHandler(async (req, res) => {
    try{
        const {playlistId} = req.params;
        const userId = req.user._id;

        const playlist = await Playlist.findOne({_id: playlistId, owner: userId});
        if(!playlist){
            next(new ApiError(404, "Playlist not found"))
        }

        await playlist.deleteOne({_id: playlistId});

        next(new ApiResponse(200, "Playlist deleted"))
    } catch(error){
        next(new ApiError(500, error.message))
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    try{
        const {playlistId, name, description} = req.body;
        const userId = req.user._id;

        const playlist = await Playlist.findOne({_id: playlistId, owner: userId});
        if(!playlist){
            next(new ApiError(404, "Playlist not found"))
        }

        playlist.name = name || playlist.name;
        playlist.description = description || playlist.description;

        await playlist.save();

        next(new ApiResponse(200, playlist))
    } catch(error){
        next(new ApiError(500, error.message))
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
