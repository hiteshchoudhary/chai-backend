import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { _id } = req.user;
  // TODO: toggle subscription

  if (!channelId) {
    throw new ApiError(400, "Please provide a valid channelId");
  }

  if (_id.toString() === channelId.toString()) {
    throw new ApiError(400, "Bro you cannot subscribe yourself");
  }

  const subscription = await Subscription.findOneAndDelete({
    subscriber: _id,
    channel: channelId,
  });

  let createdSubscription = null;

  if (!subscription) {
    const sub = await Subscription.create({
      subscriber: _id,
      channel: channelId,
    });

    createdSubscription = await Subscription.aggregate([
      {
        $match: {
          subscriber: sub.subscriber,
          channel: sub.channel,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriber",
          pipeline: [
            {
              $project: {
                _id: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                username: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "channel",
          foreignField: "_id",
          as: "channel",
          pipeline: [
            {
              $project: {
                _id: 1,
                fullName: 1,
                avatar: 1,
                coverImage: 1,
                username: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          subscriber: "$subscriber",
          channel: "$channel",
        },
      },
    ]);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribed: !subscription,
        subscription: subscription ? null : createdSubscription,
      },
      subscription ? "unsubscribed" : "subscribed"
    )
  );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
