import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "Please fill all the fields");
  }
  //TODO: create playlist
  try {
    const userId = req.user._id;
    const newPlaylist = await Playlist.create({
      name,
      description,
      videos: [],
      owner: userId,
    });
    res.status(200).json(new ApiResponse(201, newPlaylist, "Playlist created"));
  } catch (error) {
    throw new ApiError(500, "something went wrong", error.message);
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  try {
    const userPlaylists = await Playlist.findById({ owner: userId });
    if (!userPlaylists) {
      throw new ApiError(404, "PlayList doesnot exist");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, userPlaylists, "Playlist fetched"));
  } catch (error) {
    throw new ApiError(500, "something went wrong", error.message);
  }
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  try {
    const playList = await Playlist.findById(playlistId);
    if (!playList) {
      throw new ApiError(404, "PlayList doesnot exist");
    }
    return res
      .status(201)
      .json(new ApiResponse(200, playList, "Playlist fetched"));
  } catch (error) {
    throw new ApiError(500, "something went wrong", error.message);
  }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found!");
    }

    // Using $addToSet to ensure uniqueness in the videos array
    const result = await Playlist.updateOne(
      { _id: playlistId, videos: { $ne: videoId } },
      { $addToSet: { videos: videoId } }
    );

    if (result.nModified === 0) {
      throw new ApiError(401, "This Video is already in the playlist!");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, null, "Video added to playlist"));
  } catch (error) {
    throw new ApiError(500, "Something went wrong", error.message);
  }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  try {
    const playlist = await Playlist.findById(playlistId);
    if (playlist.videos.includes(playlistId)) {
      let index = playlist.video.indexOf(videoId);
      playlist.videos.splice(index, 1);
      return res
        .status(201)
        .json(new ApiResponse(200, null, "Video removed from playlist"));
    } else {
      console.log("Not Found");
      throw new ApiError(404, "Video Not Found In this playlist");
    }
  } catch (error) {
    throw new ApiError(500, "something went wrong", error.message);
  }
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  try {
    const playlist = await Playlist.findByIdAndDelete(playlistId);
    if (!playlist) {
      throw new ApiError(404, "Playlist not found!");
    }
    return res.status(201).json(new ApiResponse(200, null, "Playlist deleted"));
  } catch (error) {
    throw new ApiError(500, "something went wrong", error.message);
  }
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "Please fill all the fields");
  }
  //TODO: update playlist
  try {
    const playlist = await Playlist.findOneAndUpdate(
      { _id: playlistId },
      { $set: { name, description } },
      { new: true }
    );
    if (!playlist) {
      throw new ApiError(404, "Playlist not found!");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, playlist, "Playlist updated"));
  } catch (error) {
    throw new ApiError(500, "something went wrong", error.message);
  }
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
