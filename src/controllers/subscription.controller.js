import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const channelOwner = await User.findById(channelId);

  if (!channelOwner) {
    throw new ApiError(404, "User not found");
  }

  // Prevent the current user from subscribing to their own channel
  if (channelId.toString() === req.user._id.toString()) {
    throw new ApiError(
      400,
      "Subscription error: self-subscription is not allowed"
    );
  }

  const subscriptionRecord = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user._id,
  });

  // If subscription exists, delete the document
  if (subscriptionRecord) {
    await subscriptionRecord.deleteOne();

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Subscription removed successfully"));
  }

  // If subscription does not exist, add it
  const newSubscription = await Subscription.create({
    channel: channelId,
    subscriber: req.user._id,
  }).select("-__v");

  return res
    .status(200)
    .json(
      new ApiResponse(200, newSubscription, "Subscription added successfully")
    );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriberId");
  }

  const existingUser = await User.findById(subscriberId);

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const subscribers = await Subscription.find({
    channel: subscriberId,
  }).populate({
    path: "subscriber",
    select: "-refreshToken -password",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscriber list fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channelId");
  }

  const existingUser = await User.findById(channelId);

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const channelSubscribed = await Subscription.find({
    subscriber: channelId,
  }).populate({
    path: "channel",
    select: "-refreshToken -password",
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelSubscribed,
        "Channel subscribed list fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
