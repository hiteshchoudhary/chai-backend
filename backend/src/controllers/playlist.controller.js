import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;

  if (!name || !description) {
    throw new ApiError(400, "Both playlist name and description are required");
  }

  const existingPlaylist = await Playlist.findOne({
    name,
    owner: req.user?._id,
  });

  if (existingPlaylist) {
    throw new ApiError(400, "A playlist with this name already exists");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });

  if (!playlist) {
    throw new ApiError(400, "There was an error while creating playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  const { userId } = req.params;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "No user ID or Invalid user ID");
  }

  const userPlaylists = await Playlist.aggregate([
    //match the owner's all playlists
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    // lookup for getting owner's details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          // projecting user details
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    // converting the createdBy array to an object
    {
      $addFields: {
        createdBy: {
          $arrayElemAt: ["$createdBy", 0],
        },
      },
    },
    // this lookup if for videos
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          // further lookup to get the owner details of the video
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
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $arrayElemAt: ["$owner", 0],
              },
            },
          },
          // this is the projection for the video level
          {
            $project: {
              title: 1,
              description: 1,
              thumbnail: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    // this projection is outside at the playlist level for the final result
    {
      $project: {
        videos: 1,
        createdBy: 1,
        name: 1,
        description: 1,
      },
    },
  ]);

  if (!userPlaylists) {
    throw new ApiError(400, "No playlist found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "Playlists fetched successfully")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  //TODO: get playlist by id
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "No user playlist ID or Invalid playlist ID");
  }

  const playlistById = await Playlist.aggregate([
    //match the owner's all playlists
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    // lookup for getting owner's details
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
        pipeline: [
          // projecting user details
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    // converting the createdBy array to an object
    {
      $addFields: {
        createdBy: {
          $arrayElemAt: ["$createdBy", 0],
        },
      },
    },
    // this lookup if for videos
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          // further lookup to get the owner details of the video
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
                    fullname: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $arrayElemAt: ["$owner", 0],
              },
            },
          },
          // this is the projection for the video level
          {
            $project: {
              title: 1,
              description: 1,
              thumbnail: 1,
              owner: 1,
              duration: 1,
              views: 1,
              createdAt: 1,
              updatedAt: 1,
            },
          },
        ],
      },
    },
    // this projection is outside at the playlist level for the final result
    {
      $project: {
        videos: 1,
        createdBy: 1,
        name: 1,
        description: 1,
      },
    },
  ]);

  if (!playlistById) {
    throw new ApiError(400, "No playlist found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlistById, "playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!playlist || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid or missing playlist ID");
  }

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid or missing video ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "No such Playlist found");
  }

  if (!playlist.owner.equals(req.user?._id)) {
    throw new ApiError(403, "You are not allowed to update this playlist");
  }

  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video already exists in the Playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $push: {
        videos: videoId,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Error while adding video to the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to the Playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid or missing playlist ID");
  }

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid or missing video ID");
  }

  const playlist = await findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "No such playlist found");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to remove video from this playlist"
    );
  }

  if (!playlist.videos.includes(videoId)) {
    throw new ApiError(
      400,
      "Video with this ID does not exists in this playlist"
    );
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId,
      },
    }, // pull to remove the video ID
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Error while removing the video from the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // TODO: delete playlist
  const { playlistId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Missing or Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "No playlist found with this ID");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not allowed to delete this playlist");
  }

  const deletePlaylist = await Playlist.findByIdAndDelete(playlist._id);

  if (!deletePlaylist) {
    throw new ApiError(400, "Error while deleting this playlist");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Playlist Deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "Missing or Invalid playlist ID");
  }

  if (!name || !description) {
    throw new ApiError(400, "All the fields are required");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(400, "No playlist found with this ID");
  }

  if (!playlist.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not allowed to update this playlist");
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(400, "Error while updating this playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Playlist updated"));
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
