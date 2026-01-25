import mongoose from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//Imp: Checking ObjectId's are valid or not is done at the routing level.
const createPlaylist = asyncHandler(async (req, res) => {
    const {description} = req.body
    let {name} = req.body //can't change name if it's const

    if(!name || name.trim()=== ""){
         name=`New Playlist ${new Date().toLocaleDateString()}`
    }

    const createPlaylist = await Playlist.create({
        name: name.trim(),
        description: description ? description.trim() : "",
        videos: [],
        owner: req.user?._id
    })

    if(!createPlaylist){
        throw new ApiError(500, "Failed to create playlist")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, createPlaylist, "Playlist created successfully"))

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    const playlists = await Playlist.aggregate([
        {
            $match:{  
                    owner: new mongoose.Types.ObjectId(userId), 
            }
        },
        {
            $sort:{
                createdAt: -1 //most recent first
            }
        },
        {
            $addFields:{
                totalVideos: {$size: "$videos"}
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, playlists? playlists : [], "User playlists fetched successfully"))
    //TODO: get user playlists
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params


    const playlist = await Playlist.aggregate([
       {
         $match:{
            _id: new mongoose.Types.ObjectId(playlistId) 
        }
       },
       {
        $lookup:{
            from: "videos", //Playlist->Video
            localField: "videos", //currently in Video
            foreignField: "_id",
            as: "videos",
            pipeline: [
                {
                    $lookup:{
                        from: "users",  //Video->User
                        localField: "owner", //currently in User
                        foreignField: "_id",
                        as: "ownerDetails",
                        pipeline: [
                            {
                                $project:{
                                    username:1,
                                    avatar:1
                                }
                            }
                        ]
                    }
                },
                {
                    $addFields:{
                        ownerDetails:{ $first:"$ownerDetails"}
                    }
                }
            ]
        }
       },
    ])


    if(playlist.length === 0){
        throw new ApiError(404,"Playlist doesn't exist.")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Fetched Playslist Succesfully."))
    
    //TODO: get playlist by id
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!await Video.exists({_id: videoId})){
        throw new ApiError(400,"Video doesn't Exists, Sorry.")
    }

    const updatedPlaylist= await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user?._id
        },
        {
            $addToSet:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )


    if(!updatedPlaylist){
        throw new ApiError(404, "Playlist not found or unauthorized")
    }

    return res.status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Successfully Added video to the playlist"))
    // TODO: add video to playlist

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const updatePlaylist = await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner: req.user?._id,
        },
        {
            $pull:{
                videos:videoId
            }
        },
        {
            new:true
        }
    )

    if(!updatePlaylist){
        throw new ApiError(404,"Couldn't find playlist or unathorized request")
    }

    return res.status(200).json(new ApiResponse(200,updatePlaylist,"Successfully deleted video from the Playlist."))  
    // TODO: remove video from playlist
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    const executeDeletion = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user?._id
    })

    if(!executeDeletion){
        throw new ApiError(404,"Couldn't find playlist or Unathorized request")
    }

    return res.status(200).json(new ApiResponse(200,null,"Successfully Deleted Playlist"))
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

   if(!name || name.trim()=== ""){
    throw new ApiError(400, "Name is required")
   }

   const updateDetails= {
    name: name.trim()
   }
   //so that if no description is recieved, previous description isn't overwritten
   if( description !== undefined){  
    updateDetails.description= description.trim()
   }

   const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
        _id:playlistId,
        owner: req.user?._id
    },
    {
       $set:updateDetails
    },
    {
        new:true
    }
   )

   if(!updatedPlaylist){
    throw new ApiError(404,"Couldn't find Playlist or unauthorized req")
   }

   return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Successfully updated Playlist"))
    //TODO: update playlist
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
