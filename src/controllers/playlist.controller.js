import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const name = req.body?.name;
  const description = req.body?.description;
  const videosId = req.body?.videosId;
  const owner = req.user._id;
  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }
  const newPlaylist = new Playlist({
    name,
    description,
    videos: videosId || [],
    owner,
  });
  await newPlaylist.save();

  if (!newPlaylist) {
    throw new ApiError(500, "Failed to create playlist");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, "Playlist created successfully", newPlaylist));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const userId = req.user._id || req.params?.userId;
  const playlists = await Playlist.find({ owner: userId })
    .populate("videos")
    .sort({ createdAt: -1 })
    .select("-__v -owner");
  return res
    .status(200)
    .json(
      new ApiResponse(200, "User playlists fetched successfully", playlists)
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  const { playlistId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  const playlist = await Playlist.findById(playlistId)
    .populate("videos")
    .select("-__v -owner");
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Playlist details fetched successfully", playlist)
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const playlistId = req.params?.playlistId;
  const videoId = req.params?.videoId;
  const userId = req.user._id;

  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }
  const isValidId = await Video.findById(videoId);
  if (!isValidId) {
    throw new ApiError(404, "this is not a valid Video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  const result = playlist.videos.filter((vidId) => vidId.toString() === videoId.toString());
  console.log("this is result ", result);
  if (result.length !== 0) {
    return res
      .status(201)
      .json(
        new ApiResponse(201, "Video already available to playlist", playlist)
      );
  }
  const validateOwner = playlist.validateOwner(userId);
  if (!validateOwner) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }
  playlist.videos.push(videoId);
  await playlist.save();
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Video added to playlist successfully", playlist)
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId } = req.params;
  const { videoId } = req.params;
  const userId = req.user._id;

  if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlistId or videoId");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  const validateOwner = playlist.validateOwner(userId);
  if (!validateOwner) {
    throw new ApiError(403, "You are not authorized to modify this playlist");
  }
  playlist.videos = playlist.videos.filter((vId) => vId.toString() !== videoId);
  await playlist.save();
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Video removed from playlist successfully", playlist)
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const { playlistId } = req.params;
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  const validateOwner = playlist.validateOwner(userId);
  if (!validateOwner) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Playlist deleted successfully", deletedPlaylist)
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  const userId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) throw new ApiError(404, "No playlist found with this id");
  const validateOwner = playlist.validateOwner(userId);
  if (!validateOwner) {
    throw new ApiError(403, "You are not authorized to update this playlist");
  }
  playlist.name = name || playlist.name;
  playlist.description = description || playlist.description;
  await playlist.save();
  return res
    .status(200)
    .json(new ApiResponse(200, "Playlist updated successfully", playlist));
});

export {
  createPlaylist,
  addVideoToPlaylist,
  getUserPlaylists,
  getPlaylistById,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
