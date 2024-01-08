import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!channelId) {
    throw new ApiError(500, "Channel Id is missing !");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(500, `Malformatted id ${channelId}`);
  }

  const findChannel = User.findById(channelId);

  if (!findChannel) {
    res
      .status(404)
      .json(new ApiResponse(404, {}, `Channel with ${channelId} not found !`));
  }

  console.log(
    "user id =>",
    req.user._id,
    req.user._id.toString(),
    req.user._id.toJSON().toString()
  );

  // First of all find whether user is already subscribed to the channel or not
  const isSubscribed = await Subscription.find({
    subscriber: req.user?._id,
    channel: channelId,
  });

  console.log("Is subscribed => ", isSubscribed);

  if (isSubscribed.length === 0) {
    // User is not subscribed to this channel, hence create the subscription document
    const subscription = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });

    console.log("subscription =>", subscription);

    if (!subscription) {
      throw new ApiError(500, "Some error occured while toggling subscription");
    }

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          `${req.user?._id} subscribed to channel ${channelId} successfully.`
        )
      );
  }

  // If we have reached till here, it means that User is already subscribed to the channel, hence we can unsubscribe by deleting that subscription document.
  else {
    const unsubscribeChannel = await Subscription.findOneAndDelete({
      subscriber: req.user?._id,
      channel: channelId,
    });

    console.log("unsubscribed channel =>", unsubscribeChannel);

    if (!unsubscribeChannel) {
      throw new ApiError(500, "Some error occured while toggling subscription");
    } else {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            `${req.user?._id} unsubscribed from channel ${channelId} successfully.`
          )
        );
    }
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(500, "Channel Id is missing !");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(500, `Malformatted id ${channelId}`);
  }

  const findChannel = await User.findById(channelId);

  if (!findChannel) {
    res
      .status(404)
      .json(new ApiResponse(404, {}, `Channel with ${channelId} not found !`));
  }

  const subscribers = await Subscription.find({
    channel: channelId,
  });

  console.log("subscribers => ", subscribers);

  if (subscribers.length === 0) {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          `No subscribers found for the channel ${channelId}`
        )
      );
  } else {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribers,
          `Following users have subscribed to the channel ${channelId}`
        )
      );
  }
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(500, "Subscriber Id is missing !");
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(500, `Malformatted id ${channelId}`);
  }

  const user = await User.findById(subscriberId);

  if (!user) {
    res
      .status(404)
      .json(new ApiResponse(404, {}, `User with ${subscriberId} not found !`));
  }

  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  });

  console.log("subscribed Channels => ", subscribedChannels);

  if (subscribedChannels.length === 0) {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          `No channels subscribed by the user ${subscriberId}`
        )
      );
  } else {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannels,
          `Following channels have been subscribed by the user ${subscriberId}`
        )
      );
  }
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
