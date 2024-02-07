import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
   

    //TODO: create playlist
    const { name, description } = req.body;

  if (!name && !description) {
    throw new ApiError(400, "name and description are required!");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: new mongoose.Types.ObjectId(req.user?._id),
  });

  if (!playlist) {
    throw new ApiError(500, "error while creating playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "new playlist created successfully!"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
   
    //TODO: get user playlists
    const { userId } = req.params;
  if (!userId.trim() || !isValidObjectId(userId)) {
    throw new ApiError(400, "userid is required or invalid!");
  }
  const playlistCheck = await Playlist.find({
    owner: new mongoose.Types.ObjectId(userId),
  });
  
  if (!playlistCheck) {
    throw new ApiError(400, "playlist not found!");
  }

  const pipeline = [
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideo",
        pipeline: [
          {
            $project: {
              thumbnail: 1,
              videoFile: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        playlistVideo: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ];

  const playlist = await Playlist.aggregate(pipeline);

  if (playlist.length == 0) {
    throw new ApiError(404, "playlist not found!");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist fetched successfully!"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id
    const { playlistId } = req.params;
    const playlistAcess = await Playlist.findById(playlistId);
  
    if (playlistAcess.owner.toString() != (req.user?._id).toString()) {
      throw new ApiError(401, "Unauthorised user!");
    }
  
    const pipeline = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(playlistId),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "playlistVideo",
          pipeline: [
            {
              $project: {
                thumbnail: 1,
                videoFile: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
              },
            },
          ],
        },
      },
      {
        $project: {
          name: 1,
          description: 1,
          playlistVideo: 1,
        },
      },
    ];
  
    const playlist = await Playlist.aggregate(pipeline);
  
    if (playlist.length === 0) {
      throw new ApiError(400, "playlist not found!");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "playlist fetched!"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { playlistId } = req.params;
    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
      throw new ApiError(400, "playlist id is required or invalid!");
    }
    if (!videoId.trim() || !isValidObjectId(videoId)) {
      throw new ApiError(400, "video id is required or invalid!");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "video not found!");
    }
    const playlist = await Playlist.findById(playlistId);
  
    if (!playlist) {
      throw new ApiError(404, "playlist not found!");
    }
  
    if (playlist.owner.toString() != (req.user?._id).toString()) {
      throw new ApiError(401, "Unauthorised User!");
    }
  
    if (playlist.videos.includes(new mongoose.Types.ObjectId(videoId))) {
      throw new ApiError(500, "video alredy exists in playlist!");
    }
  
    const addVideoplaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $push: { videos: new mongoose.Types.ObjectId(videoId) },
      },
      {
        new: true,
      }
    );
  
    if (!addVideoplaylist) {
      throw new ApiError(500, "can't added a video in playlist!");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, addVideoplaylist, "video added successfully!"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
   
    // TODO: remove video from playlist
    const { videoId } = req.params;
    const { playlistId } = req.params;
    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
      throw new ApiError(400, "playlist id is required or invalid!");
    }
    if (!videoId.trim() || !isValidObjectId(videoId)) {
      throw new ApiError(400, "video id is required or invalid!");
    }
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "video not found!");
    }
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "playlist not found!");
    }
  
    if (playlist.owner.toString() != (req.user?._id).toString()) {
      throw new ApiError(401, "UNauthorised user!");
    }
    if (!playlist.videos.includes(videoId)) {
      throw new ApiError(
        400,
        "video is not added to playlist so you cant remove it!"
      );
    }
  
    const removeVideoplaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        $pull: { videos: new mongoose.Types.ObjectId(videoId) },
      },
      {
        new: true,
      }
    );
  
    if (!removeVideoplaylist) {
      throw new ApiError(500, "can't added a video in playlist!");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, removeVideoplaylist, "remove video from playlist!")
      );
})

const deletePlaylist = asyncHandler(async (req, res) => {
   
    // TODO: delete playlist
    const { playlistId } = req.params;

    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
      throw new ApiError(400, "playlist id is required or invalid!");
    }
    const playlist = await Playlist.findById(playlistId);
  
    if (!playlist) {
      throw new ApiError(404, "playlist not found!");
    }
    if (playlist.owner.toString() != (req.user?._id).toString()) {
      throw new ApiError(401, "Unauthorised user");
    }
  
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "playlist deleted successfully!"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    
    //TODO: update playlist
    const { playlistId } = req.params;
    const { name, description } = req.body;
  
    if (!playlistId.trim() || !isValidObjectId(playlistId)) {
      throw new ApiError(400, "playlist id is required or invalid!");
    }
    const playlist = await Playlist.findById(playlistId);
  
    if (!playlist) {
      throw new ApiError(404, "playlist not found!");
    }
    if (playlist.owner?.toString() != req.user._id.toString()) {
      throw new ApiError(401, "Unauthorised user!");
    }
  
    if (!name && !description) {
      throw new ApiError(400, "name and description are required!");
    }
  
    const updtedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      { $set: { name, description } },
      { new: true }
    );
  
    if (!updatePlaylist) {
      throw new ApiError(500, "error while updating playlist!");
    }
  
    return res
      .status(200)
      .json(
        new ApiResponse(200, updtedPlaylist, "playlist updated successfully!")
      );
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
