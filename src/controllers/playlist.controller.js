import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  const trimmedName = name?.toLowerCase()?.trim();
  const trimmedDescription = description?.trim();

  if (!trimmedName || !trimmedDescription) {
    throw new ApiError(400, "All fields are required");
  }

  const existingPlaylist = await Playlist.findOne({
    name: trimmedName,
    owner: req.user._id,
  });

  if (existingPlaylist) {
    throw new ApiError(409, "You already have a playlist with this name");
  }

  const newPlaylist = await Playlist.create({
    name: trimmedName,
    description: trimmedDescription,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, newPlaylist, "New playlist created successfully")
    );
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const userPlaylists = await Playlist.find({
    owner: userId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "User playlist fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId).populate("videos");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const playlist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user._id,
    },
    {
      $addToSet: { videos: videoId },
    },
    {
      new: true,
    }
  );

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added successfully"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId or playlistId");
  }

  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user._id,
    },
    {
      $pull: {
        videos: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      new: true,
    }
  );

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const deletedDocument = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!deletedDocument) {
    throw new ApiError(
      404,
      "Playlist not found or you don't have permission to delete it"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const updateObj = {};

  if (name !== undefined) {
    if (name.trim() !== "") {
      updateObj.name = name.trim();
    }
  }

  if (description !== undefined) {
    if (description.trim() !== "") {
      updateObj.description = description.trim();
    }
  }

  if (!Object.keys(updateObj).length) {
    throw new ApiError(400, "No fields provided for update");
  }

  const currentPlaylist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id,
  });

  if (!currentPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (updateObj?.name && currentPlaylist.name === updateObj.name) {
    throw new ApiError(400, "Please update the playlist name");
  }

  if (updateObj?.name) {
    const duplicate = await Playlist.findOne({
      owner: req.user._id,
      _id: { $ne: playlistId },
      name: { $regex: new RegExp(`^${updateObj.name}$`, "i") },
    });

    if (duplicate) {
      throw new ApiError(409, "You already have a playlist with this name");
    }
  }

  if (updateObj?.name) currentPlaylist.name = updateObj.name;
  if (updateObj?.description)
    currentPlaylist.description = updateObj.description;

  await currentPlaylist.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, currentPlaylist, "Playlist updated successfully")
    );
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
