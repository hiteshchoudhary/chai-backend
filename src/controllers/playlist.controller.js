import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    const owner = req.user?._id;

    if(!name){
        throw new ApiError(400,"Playlist name is required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner
    })

    if (!playlist) {
        throw new ApiError(500, "error while creating playlist");
    } 

    return res 
        .status(200)
        .json(
            new ApiResponse(200,playlist,"Playlist created successfully")
        )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"Invalid User ID");
    }
    
    const playlists = await Playlist.aggregate([
        {
            $match:{
                owner: userId
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username:1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    if(!playlists.length){
        throw new ApiError(500,"Playlists not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,playlists,"Playlists fetched successfully")
        )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: playlistId
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username:1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])
    if(!playlis.length){
        throw new ApiError(404,"Playlist not found");
    }

    return res 
        .status(200)
        .json(
            new ApiResponse(200,playlist,"Playlist fetched successfully")
        )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const userId = req.user?._id;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }

    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(401, "Unauthorised User");
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(400,"Video already in playlist")
    }

    playlist.videos.push(videoId);
    await playlist.save({validateBeforeSave:false});

    return res  
        .status(200)
        .json(
            new ApiResponse(200,playlist,"Video added to playlist")
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(401, "Unauthorised User");
    }

    playlist.videos = playlist.videos.filter((vid) => vid.toString() !== videoId)
    await playlist.save({validateBeforeSave:false})

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video removed from playlist")
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const userId = req.user?._id;

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist deleted successfully")
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    const userId = req.user?._id;

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to update this playlist");
    }

    if(name) playlist.name= name;
    if(description) playlist.description = description;

    await playlist.save({validateBeforeSave:false})

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist updated successfully")
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
