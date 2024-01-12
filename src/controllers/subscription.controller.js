import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  try {
    const userId = req.user._id;
    const existingSubscription = await Subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });

    if (existingSubscription) {
      // User is already subscribed, so unsubscribe
      const deletedSubscription = await Subscription.findOneAndDelete({
        subscriber: userId,
        channel: channelId,
      });

      return res
        .status(200)
        .json(
          new ApiResponse(200, deletedSubscription, "Unsubscribed successfully")
        );
    } else {
      // User is not subscribed, so subscribe
      const newSubscription = await Subscription.create({
        subscriber: userId,
        channel: channelId,
      });

      return res
        .status(201)
        .json(new ApiResponse(201, newSubscription, "Subscribed successfully"));
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  //kon kon subscribe kia
  const { subscriberId } = req.params;
  // const userId = req.user._id;
  try {
    //Aggregation use karengey aur details fetch karengey
    const subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: new mongoose.Types.ObjectId(subscriberId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "subscriber",
          foreignField: "_id",
          as: "subscriberDetails",
        },
      },
      {
        $project: {
          _id: 0,
          subscriberDetails: {
            _id: 1,
            username: 1,
          },
        },
      },
    ]);
    // const subscribers = await Subscription.countDocuments({ channel: subscriberId });
    //Array null nahi honi chahie islie check laga rahe hai
    const subscriberDetails =
      subscribers && subscribers.length > 0
        ? subscribers.map((subscriber) => subscriber.subscriberDetails)
        : [];
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscriberDetails[0],
          "Subscribers retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  //kaunse kaunse channels ko subscribe kia hai user ne ?
  const { channelId } = req.params;
  try {
    const subscribedChannels = await Subscription.aggregate([
      {
        $match: {
          subscriber: new mongoose.Types.ObjectId(channelId),
        },
      },
      {
        $lookup: {
          from: "users",
          let: { channelUserId: "$channel" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$channelUserId"],
                },
              },
            },
            {
              $project: {
                _id: 0, // Exclude _id field
                username: 1,
                avatar: 1,
              },
            },
          ],
          as: "channelDetails",
        },
      },
      {
        $unwind: "$channelDetails",
      },
    ]);
    // const subscribedChannels = await Subscription.find({
    //   subscriber: subscriberId,
    // });
    console.log("these are subscribed channels", subscribedChannels);
    const subscribedChannelsDetails =
      subscribedChannels && subscribedChannels.length > 0
        ? subscribedChannels.map((subscription) => subscription.channelDetails)
        : [];
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          subscribedChannelsDetails,
          "Subscribed channels retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
}); //working

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
