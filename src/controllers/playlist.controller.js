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

        if(!playlist){
            throw new ApiError(400,"playlist doesn't exist")
        }
        
        if(playlist?.owner.toString() !== userId.toString()){
           
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
    try {
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
    } catch (error) {
        throw new ApiError(500,error.message || "Unable to create playlist ")
    }
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId){
        throw new ApiError(400,"userId is required !!!");
    }
    try {
        const user = await User.findById(userId);
        if(!user){
            throw new ApiError(404,"User not found ")
        }
        const playlist = await Playlist.aggregate([
            {
                $match:{
                    owner:user?._id
    
                }
            },
            {
                $project:{
                   _id : 1,
                   name:1,
                   description:1,
                   owner:1,
                   createdAt:1,
                   updatedAt:1,
                   videos:{
                    $cond:{
                        if:{$eq:["$owner",new mongoose.Types.ObjectId(req?.user?._id)]},
                        then:"$videos",
                        else:{
                            $filter:{
                                input:"$videos",
                                as:"video",
                                cond:{
                                    $eq:["$video.isPublished",true ]
                                }

                            }
                        }

                    }
                   }
                }

            }
        ])
        if(!playlist ){
            throw new ApiError(404,"There is no Playlist made by this user")
        }
    
        return res
        .status(200)
        .json(new ApiResponse(200,playlist,"Playlist Fetched Successfully"))
    } catch (error) {
        throw new ApiError(500,error.message || "Unable to fetch Playlist or playlist doesn't exist ")
    }


})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400,"playlistId is required!!!")
    }

    try {
        const playlist = await Playlist.aggregate([
            {
                $match:{
                   _id:new mongoose.Types.ObjectId(playlistId)
    
                }
            },{//if the user is owner then he can see the playlist with the unpublished video of himself
                //but others can see the published video only
                $project:{
                    name:1,
                    description:1,
                    owner:1,
                    videos:{
                          $cond:{
                            if:{
                                $eq:["$owner",new mongoose.Types.ObjectId(req?.user?._id)]
                            },
                            then: "$videos",
                            else:{
                                $filter:{
                                    input:"$videos",
                                    as:"video",
                                    cond:{
                                        $eq:["$video.isPublished" , true]
                                    }
                                }
                            }
                          }
                    },
                    createdAt:1,
                    updatedAt:1
                }
            }
        ])
        
        if(!playlist){
            throw new ApiError(404,"Playlist Not Found")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,playlist,"Playlist Fetched Successfully"))
    } catch (error) {
        throw new ApiError(500,error.message || "playlistId is not correct" )
    }
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!playlistId || !videoId){
        throw new ApiError(400,"PlaylistId and videoId both required!!")
    }
   
    try {
        const userOwner = await isUserOwnerofPlaylist(playlistId,req?.user?._id)
        if(!userOwner){
            throw new ApiError(300,"Unauthorized Access")
        }
        const video = await Video.findById(videoId);
        //if the video is not published but video owner and current user is same then owner can add to playlist only
        if(!video || ( !(video.owner.toString() === req.user?._id.toString())  && !video?.isPublished) ){
            throw new ApiError(404,"Video Not Found");
        }
        //check if the video is already added to playlist or not
        const playlist = await Playlist.findById(playlistId)
        if(playlist.videos.includes(videoId)){
            return res
            .status(200)
            .json(new ApiResponse(200,{},"Video Is  already present In Playlist"))
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
    } catch (error) {
        throw new ApiError(500,error.message || "Unable to add video to the playlist")
        
    }

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!playlistId || !videoId){
        throw new ApiError(400,"PlaylistId and videoId both are required!!")
    }
    try {
        const userOwner = await isUserOwnerofPlaylist(playlistId,req?.user?._id)
        if(!userOwner){
            throw new ApiError(300,"Unauthorized Access")
        }
        //check video is present actually or published
        const video = await Video.findById(videoId);
        if(!video   ){
            throw new ApiError(404,"Video Not found");
        }
        
        //check video is added in playlist or not
        const playlist = await Playlist.findById(playlistId);
        if(!playlist.videos.includes(videoId)){
            throw new ApiError(404,"No Video Found in Playlist");
        } 
        //video is not published 
        if( !video?.isPublished){
            const removedVideoFromPlaylist = await Playlist.updateOne({
                _id : new mongoose.Types.ObjectId(playlistId)
            },{
                $pull:{videos:videoId}
            })
            if(!removedVideoFromPlaylist){
                throw new ApiError(500,"Unable to remove ,Retry!!!!!")
            }
            return res
            .status(200)
            .json(new ApiResponse(200,{},"Video Not found in the playlist"))

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
    
    } catch (error) {
        throw new ApiError(500,error.message || "Unable to remove video from playlist")
    }


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400,"playlistId is required!!!")
    }
    try {
        const userOwner = await isUserOwnerofPlaylist(playlistId,req?.user?._id)
        if(!userOwner){
            throw new ApiError(300,"Unauthorized Access")
        }
        const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
        if(!deletedPlaylist){
            throw new ApiError(500,"Unable to delete the Playlist")
        }
        return res
        .status(200)
        .json(new ApiResponse(200,{},"Playlist Deleted Successfully"))
    } catch (error) {
        throw new ApiError(500,error.message || "playlistId is not correct")
    }


    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!playlistId){
        throw new ApiError(400,"playlistId is required!!!")
    }
   try {
     const userOwner = await isUserOwnerofPlaylist(playlistId,req?.user?._id)
     if(!userOwner){
         throw new ApiError(300,"Unauthorized Access")
     }
     if(!name || !description){
         throw new ApiError(404,"Name and Description Both are required!!!!")
     }
     const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
         $set:{
             name:name,
             description:description
         }
     })
     
     if(!updatedPlaylist){
         throw new ApiError(500,"Unable to update the Playlist")
     }
     return res
     .status(200)
     .json(new ApiResponse(200,updatedPlaylist,"Playlist Updated Successfully"))
 
   } catch (error) {
      throw new ApiError(500,error.message || "playlistId is not correct")
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
