import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if([name, description].some((filed)=> !filed?.trim())){

        throw new ApiError(400, "Name and description are required")
    }
    if(!isValidObjectId(req.user._id)){
        throw new ApiError(400, "Invalid user id")
    }
    
    const playlist = await Playlist.create({
        name:name,
        description:description,
        owner:req.user._id,
        videos:[],
    })

    if(!playlist){
        throw new ApiError(500, "Failed to create playlist")
    }
    
    return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId?.trim()){
        throw new ApiError(400, "User id is required")
    }
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }

    const playlists = await Playlist.find({
        owner:userId
    }).populate("videos")
    if(!playlists || playlists.length === 0){
        throw new ApiError(404, "No playlists found")
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId?.trim()){
        throw new ApiError(400, "Playlist id is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findById(playlistId).populate("videos")
    
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if([playlistId,videoId].some((filed)=> !filed?.trim())){

        throw new ApiError(400, "Playlist id and video id are required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    // check video exist or not     
    const videoExist = Video.findById(videoId)
    if(!videoExist){
        throw new ApiError(404, "Video not found")
    }

    // check video already in playlist or not
    const videoInPlaylist = playlist.videos.some((video) => video._id.toString() === videoId)

    if(videoInPlaylist){
        throw new ApiError(400, "Video already in playlist")
    }

    // add video to playlist
    playlist.videos.push(videoId)
    const updatedPlaylist= await playlist.save()

    if(!updatedPlaylist){
        throw new ApiError(500, "Failed to add video to playlist")
    }

    console.log("updatedPlaylist", updatedPlaylist)
    // populate videos in playlist
    const populatedPlaylist = await updatedPlaylist.populate("videos")
    if(!populatedPlaylist){
        throw new ApiError(500, "Failed to populate videos in playlist")
    }

    console.log("populatedPlaylist", populatedPlaylist)
    // return response
    return res
    .status(200)
    .json(new ApiResponse(200, populatedPlaylist, "Video added to playlist successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if([playlistId,videoId].some((filed)=> !filed?.trim())){

        throw new ApiError(400, "Playlist id and video id are required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    // check video exist or not
    const videoExist = Video.findById(videoId)
    if(!videoExist){
        throw new ApiError(404, "Video not found")
    }

    // check video in playlist or not
    const videoInPlaylist = playlist.videos.some((video) => video._id.toString() === videoId)
    if(!videoInPlaylist){
        throw new ApiError(400, "Video not in playlist")
    }

    // remove video from playlist
    playlist.videos = playlist.videos.filter((video) => video._id.toString() !== videoId)
    const updatedPlaylist= await playlist.save()
    if(!updatedPlaylist){
        throw new ApiError(500, "Failed to remove video from playlist")
    }

    // populate videos in playlist
    const populatedPlaylist = await updatedPlaylist.populate("videos")
    if(!populatedPlaylist){
        throw new ApiError(500, "Failed to populate videos in playlist")
    }

    // return response
    res
    .status(200)
    .json(new ApiResponse(200, populatedPlaylist, "Video removed from playlist successfully"))
    

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId?.trim()){
        throw new ApiError(400, "Playlist id is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist deleted successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if([name, description].some((filed)=> !filed?.trim())){

        throw new ApiError(400, "Name and description are required")
    }
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist id")
    }

    if(!playlistId?.trim()){
        throw new ApiError(400, "Playlist id is required")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId, 
    {
        name:name,
        description:description
    },
    {
        new:true,
        runValidators:true
    })
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }   

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
 