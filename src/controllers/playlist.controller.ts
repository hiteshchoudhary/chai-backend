import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/ApiError.ts";
import { IPlaylist, Playlist } from "../models/playlist.models.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { Video } from "../models/video.models.ts";
import mongoose, { isValidObjectId } from "mongoose";
import { AuthenticatedRequest } from "./user.controller.ts";
import { Response } from "express";

const isUserOwnerOfPlaylist = async (playlistId: string, userId: string) => {
  try {
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
      throw new ApiError(404, "playlist does not exist");
    }

    if (playlist.owner.toString() !== userId.toString()) {
      return false;
    }

    return true;
  } catch (error: any) {
    throw new ApiError(500, error?.message || "Playlist Not Found");
  }
};

const createPlaylist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { name, description } = req.body;

    if (!name) {
      throw new ApiError(400, "Playlist name is required");
    }

    let playlistDescription = description || "add description";

    try {
      const playlist = await Playlist.create({
        name,
        description: playlistDescription,
        owner: req.user?._id,
        videos: [],
      });

      if (!playlist) {
        throw new ApiError(
          500,
          "Something went wrong while creating a playlist"
        );
      }

      return res
        .status(201)
        .json(new ApiResponse(200, playlist, "Playlist created successfully"));
    } catch (error: any) {
      throw new ApiError(500, error?.message || "Unable to create playlist");
    }
  }
);

const addVideoToPlaylist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { playlistId, videoId } = req.params;

    if (
      !playlistId ||
      !videoId ||
      !isValidObjectId(videoId) ||
      !isValidObjectId(playlistId)
    ) {
      throw new ApiError(400, "playlistId and videoId both are required");
    }

    try {
      const userOwner = await isUserOwnerOfPlaylist(playlistId, req.user?._id);

      if (!userOwner) {
        throw new ApiError(403, "Unauthorized Access");
      }

      const video = await Video.findById(videoId);

      if (
        !video ||
        (!(video.owner.toString() === req.user?._id.toString()) &&
          !video.isPublished)
      ) {
        throw new ApiError(404, "Video not found");
      }

      const playlist: IPlaylist | null = await Playlist.findById(playlistId);
      if (
        playlist?.videos.includes(new mongoose.Schema.Types.ObjectId(videoId))
      ) {
        return res
          .status(200)
          .json(
            new ApiResponse(200, {}, "Video is already present in Playlist")
          );
      }

      const addedPlaylist = await Playlist.findByIdAndUpdate(
        { _id: new mongoose.Types.ObjectId(playlistId) },
        {
          $push: { videos: videoId },
        },
        { new: true }
      );

      if (!addedPlaylist) {
        throw new ApiError(500, "Unable to add the video to playlist");
      }

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            addedPlaylist,
            "video successfully added to the playlist "
          )
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "Unable to add video to the playlist"
      );
    }
  }
);

const removeVideoFromPlaylist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { playlistId, videoId } = req.params;

    if (
      !playlistId ||
      !videoId ||
      !isValidObjectId(playlistId) ||
      !isValidObjectId(videoId)
    ) {
      throw new ApiError(400, "playlistId and videoId both are required");
    }

    try {
      const userOwner = await isUserOwnerOfPlaylist(playlistId, req.user?._id);

      if (!userOwner) {
        throw new ApiError(300, "Unauthorized Access");
      }

      const video = await Video.findById(videoId);

      if (!video) {
        throw new ApiError(404, "Video not found");
      }

      const playlist = await Playlist.findById(playlistId);

      if (
        !playlist?.videos.includes(new mongoose.Schema.Types.ObjectId(videoId))
      ) {
        throw new ApiError(404, "No video found in playlist");
      }

      const updatedVideoPlaylist = await Playlist.findByIdAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(playlistId),
        },
        {
          $pull: { videos: videoId },
        },
        {
          new: true,
        }
      );

      if (!updatedVideoPlaylist) {
        throw new ApiError(500, "Unable to remove video from the playlist");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedVideoPlaylist,
            "Video successfully removed from the playlist"
          )
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "Unable to remove video from the playlist"
      );
    }
  }
);

const togglePublishStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { playlistId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
      throw new ApiError(400, "playlistId is required or invalid ");
    }

    try {
      const authorized = await isUserOwnerOfPlaylist(playlistId, req.user?._id);

      if (!authorized) {
        throw new ApiError(300, "Unauthorized Access");
      }

      const playlist = await Playlist.findById(playlistId);

      const updatedPlaylist = await Playlist.findByIdAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(playlistId),
        },
        {
          $set: {
            isPublished: !playlist?.isPublished,
          },
        },
        {
          new: true,
        }
      );

      if (!updatedPlaylist) {
        throw new ApiError(500, "Unable to toggle publish status");
      }

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            updatedPlaylist,
            "Successfully toggle published status of playlist"
          )
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message ||
          "Something went wrong while toggling publish status of playlist"
      );
    }
  }
);

const getAllPlaylist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    let {
      page: pageNumber = 1,
      limit: limitNumber = 5,
      query,
      userId,
    } = req.query;

    let page = isNaN(Number(PannerNode)) ? 1 : Number(pageNumber);
    let limit = isNaN(Number(limitNumber)) ? 5 : Number(limitNumber);

    if (page < 0) {
      page = 1;
    }

    if (limit <= 0) {
      limit = 5;
    }

    const matchStage: any = {};
    if (userId && isValidObjectId(userId)) {
      matchStage["$match"] = {
        "owner.owner_id": new mongoose.Types.ObjectId(userId as string),
      };
    } else if (query) {
      matchStage["$match"] = {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { "owner.userName": { $regex: query, $options: "i" } },
        ],
      };
    } else {
      matchStage["$match"] = {};
    }

    if (userId && query) {
      matchStage["$match"] = {
        $and: [
          {
            "owner.owner_id": new mongoose.Types.ObjectId(userId as string),
          },
          {
            $or: [
              { name: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
              { "owner.userName": { $regex: query, $options: "i" } },
            ],
          },
        ],
      };
    }
    try {
      const playlists = await Playlist.aggregate([
        {
          $match: {
            $or: [
              {
                owner: new mongoose.Types.ObjectId(req.user?._id),
              },
              { isPublished: true },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "playlistOwnerInfo",
          },
        },
        {
          $unwind: "$playlistOwnerInfo",
        },
        {
          $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "playlistVideos",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "videoOwnerInfo",
                },
              },
              {
                $unwind: "$videoOwnerInfo",
              },
              {
                $match: {
                  $or: [
                    {
                      "videoOwnerInfo._id": new mongoose.Types.ObjectId(
                        req.user?._id
                      ),
                    },
                    { isPublished: true },
                  ],
                },
              },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  thumbnail: 1,
                  duration: 1,
                  views: 1,
                  createdAt: 1,
                  isPublished: 1,
                  videoOwner: {
                    userName: "$videoOwnerInfo.userName",
                    fullName: "$videoOwnerInfo.fullName",
                    avatar: "$videoOwnerInfo.avatar",
                    _id: "$videoOwnerInfo._id",
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            isPublished: 1,
            owner: {
              userName: "$playlistOwnerInfo.userName",
              fullName: "$playlistOwnerInfo.fullName",
              avatar: "$playlistOwnerInfo.avatar",
              owner_id: "$playlistOwnerInfo._id",
            },
            createdAt: 1,
            updatedAt: 1,
            playlistVideos: {
              $map: {
                input: "$playlistVideos",
                as: "video",
                in: {
                  title: "$$video.title",
                  thumbnail: "$$video.thumbnail",
                  duration: "$$video.duration",
                  views: "$$video.views",
                  createdAt: "$$video.createdAt",
                  videoOwner: "$$video.videoOwner",
                  _id: "$$video._id",
                  isPublished: "$$video.isPublished",
                },
              },
            },
          },
        },
        matchStage,
        {
          $skip: (page - 1) * limit,
        },
        {
          $limit: limit,
        },
      ]);

      if (!playlists || playlists.length === 0) {
        throw new ApiError(404, "There is no playlist");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, playlists, "playlists fetched successfully")
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "something went wrong while fetching playlists"
      );
    }
  }
);

const getPlaylistById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { playlistId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
      throw new ApiError(400, "playlistId is required or invalid");
    }

    try {
      const playlist = await Playlist.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(playlistId),
          },
        },
        {
          $match: {
            $or: [
              { owner: new mongoose.Types.ObjectId(req.user?._id) },
              { isPublished: true },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "playlistOwnerInfo",
          },
        },
        {
          $unwind: "$playlistOwnerInfo",
        },
        {
          $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "playlistVideos",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "videoOwner",
                },
              },
              {
                $unwind: "$videoOwner",
              },
              {
                $match: {
                  $or: [
                    {
                      "videoOwner._id": new mongoose.Types.ObjectId(
                        req.user?._id
                      ),
                    },
                    { isPublished: true },
                  ],
                },
              },
              {
                $project: {
                  _id: 1,
                  title: 1,
                  thumbnail: 1,
                  duration: 1,
                  views: 1,
                  isPublished: 1,
                  createdAt: 1,
                  videoOwner: {
                    userName: "$videoOwner.userName",
                    avatar: "$videoOwner.avatar",
                    fullName: "$videoOwner.fullName",
                    _id: "$videoOwner._id",
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
            owner: {
              _id: "$playlistOwnerInfo._id",
              userName: "$playlistOwnerInfo.userName",
              avatar: "$playlistOwnerInfo.avatar",
              fullName: "$playlistOwnerInfo.fullName",
            },
            playlistVideos: {
              $map: {
                input: "$playlistVideos",
                as: "video",
                in: {
                  _id: "$$video._id",
                  title: "$$video.title",
                  thumbnail: "$$video.thumbnail",
                  createdAt: "$$video.createdAt",
                  duration: "$$video.duration",
                  views: "$$video.views",
                  isPublished: "$$video.isPublished",
                  videoOwner: "$$video.videoOwner",
                },
              },
            },
          },
        },
      ]);

      if (!playlist || playlist.length === 0) {
        throw new ApiError(404, "Playlist Not Found");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "something went wrong while fetching playlist"
      );
    }
  }
);

const updatePlaylist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { playlistId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
      throw new ApiError(400, "playlistId is required or invalid");
    }

    try {
      const { name, description } = req.body;

      const userOwner = await isUserOwnerOfPlaylist(playlistId, req.user?._id);

      if (!userOwner) {
        throw new ApiError(300, "Unauthorized Access");
      }

      if (!name || !description) {
        throw new ApiError(400, "Name and Description is required");
      }

      const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
          $set: {
            name: name,
            description: description,
          },
        },
        { new: true }
      );

      if (!updatedPlaylist) {
        throw new ApiError(500, "Unable to update playlist");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(201, updatedPlaylist, "Playlist updated successfully")
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "Something went wrong while updating playlist"
      );
    }
  }
);

const deletePlaylist = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { playlistId } = req.params;

    if (!playlistId || !isValidObjectId(playlistId)) {
      throw new ApiError(400, "playlistId is required or invalid");
    }

    try {
      const userOwner = await isUserOwnerOfPlaylist(playlistId, req.user?._id);

      if (!userOwner) {
        throw new ApiError(300, "Unauthorized Access");
      }

      const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

      if (!deletedPlaylist) {
        throw new ApiError(500, "Unable to delete playlist");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully")
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "Something went wrong while deleting playlist"
      );
    }
  }
);

export {
  createPlaylist,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  togglePublishStatus,
  getAllPlaylist,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
};
