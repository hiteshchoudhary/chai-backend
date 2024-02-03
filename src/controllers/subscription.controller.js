import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const user = req.user;

  // Check if user is trying to subscribe to their own channel
  if (channelId == user._id) {
    throw new ApiError(404, "You Can't subscribe to your own channel.");
  }

  // User unsubscribing to channel
  let unsubscribe = await Subscription.findOneAndDelete({
    subscriber: user._id,
    channel: channelId,
  });

  if (unsubscribe) {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { unsubscribe },
          "Channel unsubscribe successfully"
        )
      );
  } else {
    // User subscribing to channel
    let subscribe = await Subscription.create({
      subscriber: user._id,
      channel: channelId,
    });

    if (subscribe) {
      res
        .status(200)
        .json(
          new ApiResponse(200, { subscribe }, "Channel subscribe successfully")
        );
    } else {
      throw new ApiError(404, "You can't subscribe to this channel");
    }
  }
});

const getChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  let subscribersList = await Subscription.find({ channel: subscriberId });

  if (subscribersList.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "This channel has no subscribers"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribersList },
        "Fetched subscribers list successfully"
      )
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  let subscribedChannelsList = await Subscription.find({
    subscriber: channelId,
  });

  if (subscribedChannelsList.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "You are not subscribed to any channel"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscribedChannelsList },
        "Fetched Subscribed channels list successfully"
      )
    );
});

export { toggleSubscription, getChannelSubscribers, getSubscribedChannels };
