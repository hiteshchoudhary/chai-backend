import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body    

    //TODO: create playlist
    /* 
        1. Check for the presence of name & description.
        2. Create the playlist and add up the name & description.
        3. Check for the userId from middleware.
        4. + Add the ObjectId of the User using the middleware req.user.
        4. Then, send the response.
    */
    if (!name) {
        throw new ApiError(400, "Name is required.")
    }

    const playlist = await Playlist.create({
        name,
        description: description || "",
        owner: req.user._id
    })


    if (!playlist) {
        throw new ApiError(400, "Playlist Creation Failed")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist Created Successfully")
        )
})

const getUserPlaylists = asyncHandler(async (req, res) => {

    let { userId } = req.params
    //TODO: get user playlists

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid UserId");
    }
    const userPlaylists = await Playlist.find({ owner: userId })
    .populate({
        path: "videos",
        select: "thumbnail"
    });

    if (!userPlaylists) {
        throw new ApiError(400, "Playlists not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, userPlaylists, "User Playlists Fetched Successfully")
        )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(playlistId) }
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
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $unwind: "$owner"
                    },
                    {
                        $addFields: {
                            views: {
                                $cond: {
                                    if: { $isArray: "$views" },
                                    then: { $size: "$views" },
                                    else: { $ifNull: ["$views", 0] }
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            owner: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }
    ]);

    if (!playlist || playlist.length === 0) {
        throw new ApiError(400, "Playlist not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist[0], "Playlist Fetched Successfully")
        )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or Video ID");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: { // if uses $push: it includes the same videoId again.
                videos: videoId
            }
        },
        { new: true }
    )

    if (!playlist) {
        throw new ApiError(400, "Adding Video Failed")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video added to playlist.")
        )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    
    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid Playlist ID or Video ID");
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {
                videos: videoId
            }
        },
        { new: true }
    )

    if (!playlist) {
        throw new ApiError(400, "Removing Video Failed")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Video removed from playlist.")
        )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId")
    }
    const playlist = await Playlist.findByIdAndDelete(playlistId);

    if (!playlist) {
        throw new ApiError(400, "Removing Playlist Failed")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist removed successfully")
        )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    const { name, description } = req.body;
    //TODO: update playlist

   if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId")
    }

    if (!name || !description) {
        throw new ApiError(400, "Name or Description not found.")
    }

    const playlist = await Playlist.findOneAndUpdate(
        new mongoose.Types.ObjectId(playlistId),
        {
            $set: {
                name,
                description
            }
        },
        { new: true }
    );

    if (!playlist) {
        throw new ApiError(400, "Updating Playlist Failed")
    }

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
