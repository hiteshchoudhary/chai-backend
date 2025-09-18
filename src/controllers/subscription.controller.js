import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // TODO: toggle subscription
  const { channelId } = req.params;
  const subscriberId = req.user._id;
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });
  if (existingSubscription) {
    const unsubscribed = await Subscription.findByIdAndDelete(
      existingSubscription._id
    );

    if (!unsubscribed) {
      throw new ApiError(501, "failed to delete the object");
      // throw new ApiError(501,"failed to unsubscribe the channel");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, unsubscribed, "unsubscribed successfully"));
  }
  const subscription = new Subscription({
    subscriber: subscriberId,
    channel: channelId,
  });
  await subscription.save();
  res.status(201).json(
    new ApiResponse(201, "Subscribed successfully", {
      subscription,
      length: subscription.length,
    })
  );
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const subscribers = await Subscription.find({
    channel: subscriberId,
  }).populate("subscriber", "username email avatar");
  res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const subscriberId = req.user._id;
  const subscriptions = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "username email avatar");
  res
    .status(200)
    .json(
      new ApiResponse(200, "Subscriptions fetched successfully", subscriptions)
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
