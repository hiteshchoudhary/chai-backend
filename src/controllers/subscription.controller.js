import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    const { channelId } = req.params;
  if (!channelId.trim() || !isValidObjectId(channelId)) {
    throw new ApiError(400, "channelid is required or invalid!");
  }
  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError("channel is not found !");
  }

  const isAlredySubscribed = await Subscription.find({
    subscriber: new mongoose.Types.ObjectId(req.user?._id),
    channel: new mongoose.Types.ObjectId(channelId),
  });

  if (isAlredySubscribed.length == 0) {
    const subscibedDoc = await Subscription.create({
      subscriber: new mongoose.Types.ObjectId(req.user?._id),
      channel: new mongoose.Types.ObjectId(channelId),
    });
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "subscription added!"));
  } else {
    const deleteDoc = await Subscription.findOneAndDelete(
      isAlredySubscribed._id
    );
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "remove subscription!"));
  }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
  if (!channelId.trim() || !isValidObjectId(channelId)) {
    throw new ApiError(400, "channelid is requierd or invalid");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(400, "channel not found!");
  }

  const subscriber = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },

    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: {
          $first: "$subscribers",
        },
      },
    },
    {
      $project:{
        subscribers:1
      }
    }
  ]);

  if (subscriber.length == 0) {
    throw new ApiError(404, "No subscriber found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subscriber, "fetched subscirber successfully!"));

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
  if (!channelId.trim() || !isValidObjectId(channelId)) {
    throw new ApiError(400, "channle id is required or invalid!");
  }

  const channel = await User.findById(channelId);

  if (!channel) {
    throw new ApiError(404, "user not found!");
  }

  const subscribedToChannel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribedTo",
        pipeline: [
          {
            $project: {
              fullname: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscribedTo: {
          $first: "$subscribedTo",
        },
      },
    },
    {
      $project: {
        subscribedTo: 1,
      },
    },
    {
      $replaceRoot: {
        newRoot: "$subscribedTo",
      },
    },
  ]);

  if (subscribedToChannel.length == 0) {
    throw new ApiError(404, "No subscriber found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedToChannel,
        "fetched subscirber successfully!"
      )
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}