import { Playlist } from "../models/playlist.model.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { Types, isValidObjectId } from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


// create playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const userId = req.user._id;

    // check if any field is empty
    if (!name || !description) {
        throw new ApiError(400, "All fields are required!");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: userId
    })

    if (!playlist) {
        throw new ApiError(500, "Something went wrong while creating playlist!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Playlist created successfully"
    ))
})

// get user playlists by userId
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // check if Invalid userId
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId!");
    }

    // check if user not exist
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found!");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $sort: { createdAt: -1 }
                    },
                    {
                        $limit: 1,
                    },
                    {
                        $project: {
                            thumbnail: 1,
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                playlistThumbnail: {
                    $cond: {
                        if: { $isArray: "$videos" },
                        then: { $first: "$videos.thumbnail" },
                        else: null,
                    },
                },
            },
        },
        {
            $project: {
                name: 1,
                description: 1,
                playlistThumbnail: 1
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(
        200,
        { playlists },
        "Playlists fetched successfully"
    ));
});

// get playlist by playlistId
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    // check if Invalid playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId!");
    }

    // check if playlist not exist
    const isPlaylistExist = await Playlist.findById(playlistId);
    if (!isPlaylistExist) {
        throw new ApiError(404, "Playlist not found!");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new Types.ObjectId(playlistId),
            },
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
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ]);

    return res.status(200).json(new ApiResponse(
        200,
        { playlist: playlist[0] },
        "Playlist fetched successfully"
    ));
});

// add video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // check if Invalid playlistId or videoId
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId!");
    }

    // check if playlist or video not exist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found!");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found!");
    }

    // check if video is already in the playlist
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video is already in the playlist!");
    }

    // add video to playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $push: { videos: videoId },
    });

    if (!updatedPlaylist) {
        throw new ApiError(500, "Something went wrong while adding video to playlist!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Video added to playlist successfully"
    ));
});

// remove video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    // check if Invalid playlistId or videoId
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId!");
    }

    // check if playlist or video not exist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found!");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found!");
    }

    // remove video from playlist
    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $pull: { videos: videoId },
    });

    if (!updatedPlaylist) {
        throw new ApiError(400, "Something went wrong while remove video to playlist!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Video removed from playlist successfully"
    ));
});

// delete playlist by playlistId
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    // check if Invalid playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId!");
    }

    // check if playlist not exist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found!");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if (!deletedPlaylist) {
        throw new ApiError(500, "Something went wrong while deleting playlist!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Playlist deleted successfully"
    ))
})

// update playlist by playlistId
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    // check if Invalid playlistId
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId!");
    }

    // check if any field is empty
    if (!name || !description) {
        throw new ApiError(400, "All fields are required!");
    }

    // check if playlist not exist
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found!");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $set: {
            name,
            description
        }
    })

    if (!updatedPlaylist) {
        throw new ApiError(500, "Something went wrong while updating playlist!");
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Playlist updated successfully"
    ))
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