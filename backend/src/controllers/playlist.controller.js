import mongoose from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User} from "../models/user.model.js"
import { Video } from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name) {
        return ApiError(400, "playlist must have a name")
    }
    const playlist = await Playlist.create({
        name:name,
        description:description,
        video:[],
        owner: req?.author._id
    })
    
    if (!playlist) {
        return ApiError(400, "something went wrong while cresting playlist")
    }
   
    return res.status(200).json(
        new ApiResponse(200, playlist, "palylist created success")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userID} = req.params
    console.log("getUserPlaylists called", req);
    if (!userID) {
        return new ApiError(400, "id must feild")
    }
    const user = await User.aggregate([
        {
            $match: {
                numberID:parseInt(userID),
            }
        },
        {
            $lookup: {
                from : "playlists",
                localField: "_id",
                foreignField: "owner",
                as: "playlist",
                pipeline: [
                    {
                        $lookup: {
                            from : "videos",
                            localField: "videos",
                            foreignField: "_id",
                            as: 'videosInPlaylist',
                        }
                    },
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: 'ownerOfPlaylist',
                            pipeline: [
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    } 
                ]
            }
        },
        {
            $addFields: {
                numbersOfPlaylist: {
                    $size: "$playlist"
                }
            }
        },
        {
            $project: {
               fullName: 1,
               username: 1,
               numbersOfPlaylist:1,
               email:1,
               playlist: 1,
            }
        }
    ])
    if (!user) {
        throw new ApiError(400, "something went wrong while getting user playlist")
    }
    
    return res.status(200).json(
        new ApiResponse(200, user, "user playlist festhed success")
    )
})



const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistID} = req.params
    if (!playlistID) {
        return ApiError(499, "id is must")
    }
    const playlist = await Playlist.aggregate([
        {
            $match: {
                numberID: parseInt(playlistID),
            }
        },
    ])

    if (!playlist) {
        return ApiError(400, "something wnet wrong while getting playlist by name")
    }
    return res.status(200).json(
        new ApiResponse(200, playlist, "success")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // validate IDs
    if (!playlistId || !videoId) {
        throw new ApiError(400, "PlaylistId and VideoId are required");
    }

    // check video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // update playlist by pushing videoId
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: video._id } },
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    );
});


const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    await Playlist.deleteOne(playlistId)
    return res.status(200).json(
        new ApiResponse(200, {}, "deleted playsist success")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    const updatePlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { name: name },
        {description: description},
        { new: true }
    );
    return res.status(200).json(
        new ApiResponse(200, {"updatePlaist": updatePlaylist}, "deleted playsist success")
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
