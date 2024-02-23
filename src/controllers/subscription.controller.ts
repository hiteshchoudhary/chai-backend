import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.models.ts";
import { ApiError } from "../utils/ApiError.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { User } from "../models/user.models.ts";
import { AuthenticatedRequest } from "./user.controller.ts";
import { Request, Response } from "express";

const toggleSubscription = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { channelId } = req.params;

    if (!channelId) {
      throw new ApiError(400, "Channel Id is required");
    }

    const userId = req.user?._id;

    const credential = { subscriber: userId, channel: channelId };

    try {
      const subscribed = await Subscription.findOne(credential);
      if (!subscribed) {
        const newSubscription = await Subscription.create(credential);
        if (!newSubscription) {
          throw new ApiError(500, "Unable to subscibe channel");
        }
        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              newSubscription,
              "Channel Subscribed successfully"
            )
          );
      } else {
        const deletedSubscription = await Subscription.deleteOne(credential);
        if (!deletedSubscription) {
          throw new ApiError(500, "Unable to Unsubscribe channel");
        }

        return res
          .status(200)
          .json(
            new ApiResponse(
              200,
              deletedSubscription,
              "Channel Unsubscribed successfully"
            )
          );
      }
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message || "Unable to toggle Subscription"
      );
    }
  }
);

const getChannelSubscribers = asyncHandler(
  async (req: Request, res: Response) => {
    const { channelId } = req.params;

    if (!channelId || !isValidObjectId(channelId)) {
      throw new ApiError(400, "channelId is required or invalid");
    }

    try {
      const channel = await User.findById(channelId);

      if (!channel) {
        throw new ApiError(404, "Channel not found");
      }

      const subscribers = await Subscription.aggregate([
        {
          $match: {
            channel: new mongoose.Types.ObjectId(channelId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channel",
            foreignField: "_id",
            as: "channelInfo",
          },
        },
        {
          $unwind: "$channelInfo",
        },
        {
          $lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $unwind: "$userInfo",
        },
        {
          $project: {
            _id: 1,
            channel: 1,
            channelInfo: {
              channel_id: "$channelInfo._id",
              channelName: "$channelInfo.userName",
              avatar: "$channelInfo.avatar",
              createdAt: "$channelInfo.createdAt",
            },
            userInfo: {
              user_id: "$userInfo._id",
              userName: "$userInfo.userName",
              avatar: "$userInfo.avatar",
              fullName: "$userInfo.fullName",
            },
          },
        },
        {
          $group: {
            _id: "$channel",
            subscribers: {
              $push: "$userInfo",
            },
            channelInfo: {
              $first: "$channelInfo",
            },
          },
        },
        {
          $addFields: {
            subscribersCount: {
              $size: "$subscribers",
            },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]);

      if (!subscribers || subscribers.length === 0) {
        throw new ApiError(404, "No Subscribers found");
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            subscribers,
            "Channel Subscribers fetched successfully"
          )
        );
    } catch (error) {
      throw new ApiError(
        500,
        "something went wrong while fetching data of channel subscribers"
      );
    }
  }
);

const getUserSubscribedChannels = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const channelList = await Subscription.aggregate([
        {
          $match: {
            subscriber: new mongoose.Types.ObjectId(req.user?._id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $unwind: "$userInfo",
        },
        {
          $lookup: {
            from: "users",
            localField: "channel",
            foreignField: "_id",
            as: "channelInfo",
          },
        },
        {
          $unwind: "$channelInfo",
        },
        {
          $project: {
            _id: 1,
            channel: 1,
            channelInfo: {
              channel_id: "$channelInfo._id",
              channelName: "$channelInfo.userName",
              avatar: "$channelInfo.avatar",
              createdAt: "$channelInfo.createdAt",
            },
            userInfo: {
              user_id: "$userInfo._id",
              userName: "$userInfo.userName",
              avatar: "$userInfo.avatar",
              fullName: "$userInfo.fullName",
            },
          },
        },
        {
          $group: {
            _id: "$subscriber",
            subscribedChannels: {
              $push: "$channelInfo",
            },
            userInfo: {
              $first: "$userInfo",
            },
          },
        },
        {
          $addFields: {
            subscribedChannelCount: {
              $size: "$subscribedChannels",
            },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]);

      if (!channelList || channelList.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "Not subscribed any channel"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            channelList,
            "User subscribed channel list fetched successfully"
          )
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message ||
          "Something went wrong while fetching user subscribed channel list"
      );
    }
  }
);

const getUserChannelSubscribers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const channelSubscribers = await Subscription.aggregate([
        {
          $match: {
            channel: new mongoose.Types.ObjectId(req.user?._id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "channel",
            foreignField: "_id",
            as: "channelInfo",
          },
        },
        {
          $unwind: "$channelInfo",
        },
        {
          $lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "userInfo",
          },
        },
        {
          $unwind: "$userInfo",
        },
        {
          $project: {
            _id: 1,
            channel: 1,
            channelInfo: {
              channel_id: "$channelInfo._id",
              channelName: "$channelInfo.userName",
              avatar: "$channelInfo.avatar",
              createdAt: "$channelInfo.createdAt",
            },
            userInfo: {
              user_id: "$userInfo._id",
              userName: "$userInfo.userName",
              avatar: "$userInfo.avatar",
              fullName: "$userInfo.fullName",
            },
          },
        },
        {
          $group: {
            _id: "$channel",
            subscribers: {
              $push: "$userInfo",
            },
            channelInfo: {
              $first: "$channelInfo",
            },
          },
        },
        {
          $addFields: {
            subscribersCount: {
              $size: "$subscribers",
            },
          },
        },
        {
          $project: {
            _id: 0,
          },
        },
      ]);

      if (!channelSubscribers || channelSubscribers.length === 0) {
        return res
          .status(200)
          .json(new ApiResponse(200, {}, "No Subscribers found"));
      }

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            channelSubscribers,
            "user channel subscribed successfully"
          )
        );
    } catch (error: any) {
      throw new ApiError(
        500,
        error?.message ||
          "something went wrong while fetching user channel subscribers"
      );
    }
  }
);

export {
  toggleSubscription,
  getChannelSubscribers,
  getUserSubscribedChannels,
  getUserChannelSubscribers,
};
