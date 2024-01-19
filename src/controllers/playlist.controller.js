import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"

const isUserOwnerofPlaylist = async(playlistId,userId)=>{

    try {
        const playlist = await Playlist.findById(playlistId);
        
        if(!playlist || playlist?.owner.toString() !== userId.toString()){
            return false;
        }
        
        return true;
    } catch (e) {
        throw new ApiError(400,e.message || 'Playlist Not Found')
    }
    
}
const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!name){
        throw new ApiError(400,"Name is Required to Create a Playlist!!")
    }
    let playlistDescription = description || " ";
    const playlist = await Playlist.create({
        name,
        description : playlistDescription,
        owner:req.user?._id,
        videos:[]
    })
    if(!playlist){
        throw new ApiError(500,"Something error happened while trying to create a playlist")
    }
    return res
    .status(201)
    .json(new ApiResponse(200,playlist,"Playlist Created Successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId){
        throw new ApiError(400,"userId is required !!!");
    }
    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404,"User not found ")
    }
    const playlist = await Playlist.aggregate([
        {
            $match:{
                owner:user?._id

            }
        },{
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },{
            $match:{
                "videos.isPublished" : true
            }
        }
    ])
    if(!playlist || playlist.length === 0){
        throw new ApiError(404,"There is no Playlist made by this user")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist Fetched Successfully"))


})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400,"playlistId is required!!!")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"Playlist Not Found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist Fetched Successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!playlistId || !videoId){
        throw new ApiError(400,"Playlist or video Not Found")
    }
    //current user is owner of the playlist or not
    const userOwner = await isUserOwnerofPlaylist(playlistId,req?.user?._id)
    if(!userOwner){
        throw new ApiError(300,"Unauthorized Access")
    }
    const video = await Video.findById(videoId);
    if(!video || !video?.isPublished ){
        throw new ApiError(404,"Video Not Found");
    }
    const addedplaylist = await Playlist.updateOne({
        _id : new mongoose.Types.ObjectId(playlistId)
    },{
        $push:{videos:videoId}
    })
    if(!addedplaylist){
        throw new ApiError(500,"Unable to add the video to the playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,addedplaylist,"Video Successfully Added To Playlist"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!playlistId || !videoId){
        throw new ApiError(400,"PlaylistId and videoId both are required!!")
    }
    const userOwner = await isUserOwnerofPlaylist(playlistId,req?.user?._id)
    if(!userOwner){
        throw new ApiError(300,"Unauthorized Access")
    }
    //check video is present actually or published
    const video = await Video.findById(videoId);
    if(!video || !video?.isPublished  ){
        throw new ApiError(404,"No Video Found in Playlist");
    }
    //check video is added in playlist or not
    const videoPresentInPlaylist = await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId),
                videos:{
                    $in:[new mongoose.Types.ObjectId(videoId)]
                }
            }
        }])
    if(!videoPresentInPlaylist){
        throw new ApiError(404,"No Video Found in Playlist");
    }
      
    const removedVideoFromPlaylist = await Playlist.updateOne({
        _id : new mongoose.Types.ObjectId(playlistId)
    },{
        $pull:{videos:videoId}
    })
    if(!removedVideoFromPlaylist){
        throw new ApiError(500,"Unable to remove the video from the playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,addedplaylist,"Video Successfully Removed From Playlist"))



})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400,"playlistId is required!!!")
    }
    const userOwner = await isUserOwnerofPlaylist(playlistId,req?.user?._id)
    if(!userOwner){
        throw new ApiError(300,"Unauthorized Access")
    }
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if(deletedPlaylist){
        throw new ApiError(500,"Unable to delete the Playlist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,{},"Playlist Deleted Successfully"))


    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!playlistId){
        throw new ApiError(400,"playlistId is required!!!")
    }
    const userOwner = await isUserOwnerofPlaylist(playlistId,req?.user?._id)
    if(!userOwner){
        throw new ApiError(300,"Unauthorized Access")
    }
    if([name,description].some((field)=>field.trim() === "")){
        throw new ApiError(404,"Name and Description Both are required!!!!")
    }
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
        $set:{
            name:name,
            description:description
        }
    })
    
    if(updatedPlaylist){
        throw new ApiError(500,"Unable to update the Playlist")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Playlist Updated Successfully"))




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
