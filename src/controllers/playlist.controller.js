import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  let playlist = await Playlist.create({
    name: name,
    description: description,
    owner: req.user?._id,
  });
  if (!playlist) {
    throw new ApiError(400, "Error occured while creating the playlist");
  }

  res
    .status(200)
    .json(new ApiResponse(200, { playlist }, "playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  let userPlaylists = await Playlist.findOne({ owner: userId });
  if (!userPlaylists) {
    throw new ApiError(404, "User playlist not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { userPlaylists }, "playlist fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id

  let getPlaylists = await Playlist.findById({ _id: playlistId });
  if (!getPlaylists) {
    throw new ApiError(404, "Playlist not found");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { getPlaylists }, "playlist fetched successfully")
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  // Get playlist
  let playlist = await Playlist.findById({
    _id: playlistId,
  });
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  // Get video
  let videoToAdd = await Video.findById({ _id: videoId });
  if (!videoToAdd) {
    throw new ApiError(404, "Video not found to add to playlist");
  }

  // check if video is already present
  let isVideoAlreadyInPlaylist = await playlist.videos.some(
    (video) => video.toString() == videoId
  );
  if (isVideoAlreadyInPlaylist) {
    throw new ApiError(400, "Video is already in the playlist");
  }

  // Update playlist
  let playlistToAddVideoIn = await Playlist.findByIdAndUpdate(
    { _id: playlistId },
    { $push: { videos: videoToAdd } },
    { new: true }
  );
  if (!playlistToAddVideoIn) {
    throw new ApiError(404, "Playlist not found to add to video");
  }

  // send response
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlistToAddVideoIn },
        "Video successfully added to the Playlist"
      )
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  let playlistBeforeUpdate = await Playlist.findById(playlistId);
  // Error if video not present
  if (!playlistBeforeUpdate.videos.includes(videoId)) {
    throw new ApiError(400, "Video not found in the playlist");
  }
  
  // Get playlist
  let playlist = await Playlist.findByIdAndUpdate(
    { _id: playlistId },
    { $pull: { videos: videoId } },
    { new: true }
  );
  if (!playlist) {
    throw new ApiError(404, "Playlist not found to delete video");
  }


  // send response
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist },
        "Video successfully removed from the playlist"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  let getPlaylistsToDelete = await Playlist.findByIdAndDelete({
    _id: playlistId,
  });
  if (!getPlaylistsToDelete) {
    throw new ApiError(404, "Playlist not found to delete");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { getPlaylistsToDelete },
        "playlist deleted successfully"
      )
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;

  //TODO: update playlist
  let PlaylistsToUpdate = await Playlist.findById({ _id: playlistId });
  if (!PlaylistsToUpdate) {
    throw new ApiError(404, "Playlist not found to update");
  }

  // Check if both name and description are empty
  const trimmedName = name.trim();
  const trimmedDescription = description.trim();

  if (!trimmedName && !trimmedDescription) {
    throw new ApiError(
      400,
      "Playlist name and description both can't be empty"
    );
  }

  // Check if both name and description are unchanged
  if (
    trimmedName === PlaylistsToUpdate.name.trim() &&
    trimmedDescription === PlaylistsToUpdate.description.trim()
  ) {
    throw new ApiError(400, "Playlist name and description are unchanged");
  }

  // Check and update name if it is not empty and different
  if (trimmedName !== "" && trimmedName !== PlaylistsToUpdate.name.trim()) {
    PlaylistsToUpdate.name = name;
  }

  // Check and update description if it is not empty and different
  if (
    trimmedDescription !== "" &&
    trimmedDescription !== PlaylistsToUpdate.description.trim()
  ) {
    PlaylistsToUpdate.description = description;
  }

  PlaylistsToUpdate.save();

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { PlaylistsToUpdate },
        "Playlist updated successfully"
      )
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
