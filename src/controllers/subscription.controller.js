import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Types } from "mongoose";

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

    // !Note: This aggregation can be avoided if we do not want to get a populated data on which channel got subscribed by which user.
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
          subscriber: {
            $first: "$subscriber",
          },
          channel: {
            $first: "$channel",
          },
        },
      },
    ]);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        subscribed: !subscription,
        subscription: subscription ? null : createdSubscription[0],
      },
      subscription ? "unsubscribed" : "subscribed"
    )
  );
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  // ! Note: Uncomment this to show one's subscribers to them only.
  // const { _id } = req.user;
  //
  // if(_id.toString() !== channelId.toString()) {
  //   throw new ApiError(403, "You are not authorized to check other's subscribers")
  // }

  const { page, size } = req.query;

  const pageNumber = Number(page) ? Number.parseInt(page) : 1;
  const querySize = Number(size) ? Number.parseInt(size) : 15;

  if (querySize > 100) {
    throw new ApiError(400, "Bro set realistic limits!!");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new Types.ObjectId(channelId),
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
              username: 1,
              avatar: 1,
              coverImage: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: {
          $first: "$subscriber",
        },
      },
    },
    {
      $project: {
        _id: 0,
        subscriber: 1,
      },
    },
    {
      $skip: (pageNumber - 1) * querySize,
    },
    {
      $limit: querySize,
    },
    {
      $replaceRoot: {
        newRoot: "$subscriber",
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      subscribers,
    })
  );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  // ! Note: Uncomment this to show one's subscribed channels to them only.
  // const { _id } = req.user;
  //
  // if(_id.toString() !== subscriberId.toString()) {
  //   throw new ApiError(403, "You are not authorized to check other's subscribed channels")
  // }

  const { page, size } = req.query;

  const pageNumber = Number(page) ? Number.parseInt(page) : 1;
  const querySize = Number(size) ? Number.parseInt(size) : 15;

  if (querySize > 100) {
    throw new ApiError(400, "Bro set realistic limits!!");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new Types.ObjectId(subscriberId),
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
              username: 1,
              coverImage: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channel: {
          $first: "$channel",
        },
      },
    },
    {
      $skip: (pageNumber - 1) * querySize,
    },
    {
      $limit: querySize,
    },
    {
      $replaceRoot: {
        newRoot: "$channel",
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      channels: subscribedChannels,
    })
  );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
