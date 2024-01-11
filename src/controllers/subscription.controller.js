import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//! 1st method to handle toggleSubscription
// const toggleSubscription = asyncHandler(async (req, res) => {
//   const { channelId } = req.params;
//   // TODO: toggle subscription

//   if (!channelId) {
//     new ApiResponse(404, {}, "Channel not found");
//   }

//   if (!isValidObjectId(channelId)) {
//     throw new ApiError(500, `Invalid id formate ${channelId}`);
//   }

//   const userChannel = await User.findById(channelId);

//   if (!userChannel) {
//     new ApiResponse(404, {}, "Channel not found");
//   }

//   const isSubscribed = await Subscription.find({
//     subscriber: req.user?._id,
//     channel: channelId,
//   });

//   console.log("Is subscribed => ", isSubscribed);

//   if (isSubscribed.length === 0) {
//     const subscription = await Subscription.create({
//       subscriber: req.user._id,
//       channel: channelId,
//     });

//     if (!subscription) {
//       throw new ApiError(
//         500,
//         "Some error occurred while creating subscription"
//       );
//     }

//     return res
//       .status(200)
//       .json(
//         new ApiResponse(
//           200,
//           subscription,
//           `User ${(req.user, _id)} is subscribed to ${channelId}`
//         )
//       );
//   } else {
//     const unsubscribeChannel = Subscription.findByIdAndDelete({
//       subscriber: req.user?._id,
//       channel: channelId,
//     });

//     if (!unsubscribeChannel) {
//       throw new ApiError(
//         500,
//         "Some error occurred while deleting subscription"
//       );
//     } else {
//       return res
//         .status(200)
//         .json(
//           new ApiResponse(
//             200,
//             {},
//             `User ${(req.user, _id)} is unsubscribed to ${channelId}`
//           )
//         );
//     }
//   }
// });

//! 2nd method to handle toggleSubscription

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!channelId) {
    new ApiResponse(404, {}, "Channel not found");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(500, `Invalid id formate ${channelId}`);
  }

  const isSubscribed = await User.findOne({
    $and: [
      { subscriber: new mongoose.Types.ObjectId(req.user?._id) },
      { channel: new mongoose.Types.ObjectId(channelId) },
    ],
  });

  if (!isSubscribed) {
    const subscriber = await Subscription.create({
      subscriber: new mongoose.Types.ObjectId(req.user._id),
      channel: new mongoose.Types.ObjectId(channelId),
    });

    if (!subscriber) {
      throw new ApiError(500, "Something went wrong while toggle subscription");
    }
  } else {
    new Subscription.findByIdAndDelete(isSubscribed._id);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Toggle subscription successfully "));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    new ApiResponse(404, {}, "Channel not found");
  }

  if (!isValidObjectId(channelId)) {
    throw new ApiError(500, `Invalid id formate ${channelId}`);
  }

  // const userChannel = await User.findById(channelId);

  // if (!userChannel) {
  //   new ApiResponse(404, {}, "Channel not found");
  // }

  // const subscribers = await Subscription.find({
  //   channel: channelId,
  // });

  // if (subscribers.length === 0) {
  //   return res
  //     .status(200)
  //     .json(new ApiResponse(200, {}, `No user subscribed to ${channelId}`));
  // } else {
  //   return res
  //     .status(200)
  //     .json(
  //       new ApiResponse(
  //         200,
  //         subscribers,
  //         `This user subscribed to ${channelId}`
  //       )
  //     );
  // }

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "allSubscribers",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "get subscribers successfully"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    new ApiResponse(404, {}, "Channel not found");
  }

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(500, `Invalid id formate ${subscriberId}`);
  }

  // const user = await User.findById(subscriberId);

  // if (!user) {
  //   new ApiResponse(404, {}, "User not found");
  // }

  // const subscribedChannels = await Subscription.find({
  //   subscriber: subscriberId,
  // });

  // if (subscribedChannels.length === 0) {
  //   return res
  //     .status(200)
  //     .json(
  //       new ApiResponse(
  //         200,
  //         {},
  //         `No channel subscribed by this user ${subscriberId}`
  //       )
  //     );
  // } else {
  //   return res
  //     .status(200)
  //     .json(
  //       new ApiResponse(
  //         200,
  //         subscribedChannels,
  //         `This channel subscribed by this user ${subscriberId}`
  //       )
  //     );
  // }

  const subscribed = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "allChannels",
        pipeline: [
          {
            $project: {
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, subscribed, "get subscribers successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
