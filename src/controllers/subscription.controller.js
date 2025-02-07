import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;
  // TODO: toggle subscription

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  if (subscriberId.toString() === channelId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  }

  await Subscription.create({ subscriber: subscriberId, channel: channelId });
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Subscribed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const channelId = req.user._id;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const subscribersDocs = await Subscription.find({
    channel: channelId,
  }).populate("subscriber", "_id name email");

  if (!subscribersDocs) {
    throw new ApiError(404, "Subscriber list is not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribersDocs, "Subscribers fetched successfullyy")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscriberId = req.user._id;

  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "_id name email");

  if (!subscribedChannels) {
    throw new ApiError(404, "Channel list is not found");
  }

  return res
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
