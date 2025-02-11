import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  const userID = req.user.id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "invalid channel ID");
  }

  const existingSubscription = await Subscription.findOne({
    user: userID,
    chaneel: channelId,
  });

  if (existingSubscription) {
    await existingSubscription.remove();

    return res.status(200).json(new ApiResponse("Unsubscribed Successfully"));
  }

  const newSubscriber = new Subscription({
    user: userID,
    channel: channelId,
  });

  await newSubscriber.save();

  res
    .status(200)
    .json(new ApiResponse(200, newSubscriber, "Subscribed Successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const subscriber = await Subscription.find({ channel: channelId }).populate(
    "user",
    "username email"
  );

  if (!subscriber || subscriber.length === 0) {
    throw new ApiError(404, "No subscriber found for this channel");
  }

  const subscriberList = subscriber.map((sub) => sub.user);

  res
    .status(200)
    .json(
      new ApiResponse(200, subscriberList, "Subscribers fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(200, "Invalid subscriber ID");
  }

  const subscriptions = await Subscription.find({
    user: subscriberId,
  }).populate("channel", "channelName channelDescription");

  if (!subscriptions || subscriptions.length === 0) {
    throw new ApiError(404, "No subscribers found");
  }

  const subscribedChannels = subscriptions.map((sub) => sub.channel);

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
