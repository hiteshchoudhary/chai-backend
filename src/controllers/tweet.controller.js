import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  CreateTweetSchema,
  UpdateTweetSchema,
} from "../schema/tweet.schema.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId, Types } from "mongoose";
import { Like } from "../models/like.model.js";

const createTweet = asyncHandler(async (req, res) => {
  const requestBodyValidationResult = CreateTweetSchema.safeParse(req.body);

  if (!requestBodyValidationResult.success) {
    throw new ApiError(
      400,
      requestBodyValidationResult.error.errors[0]?.message,
      requestBodyValidationResult.error.errors.map((err) => err.message)
    );
  }

  const { _id } = req.user;
  const requestBody = requestBodyValidationResult.data;

  const tweet = await Tweet.create({
    content: requestBody.content.trim(),
    owner: _id,
  });

  return res.status(200).json(
    new ApiResponse(200, {
      tweet,
    })
  );
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { page, limit } = req.query;
  const { userId } = req.params;

  const pageNumber = Number(page) ? Number.parseInt(page) : 1;
  const sizeLimit = Number(limit) ? Number.parseInt(limit) : 10;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Provide a valid ObjectID as tweetId", [
      "Provide a valid ObjectID as tweetId",
    ]);
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              fullName: 1,
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "liked_by",
        pipeline: [
          {
            $project: {
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        likes: {
          $size: "$liked_by",
        },
        isLiked: {
          $cond: {
            if: {
              $in: [req.user?._id, "$liked_by.likedBy"],
            },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $unset: ["liked_by"],
    },
    {
      $skip: (pageNumber - 1) * sizeLimit,
    },
    {
      $limit: sizeLimit,
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      tweets,
    })
  );
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { _id } = req.user;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Provide a valid ObjectID as tweetId", [
      "Provide a valid ObjectID as tweetId",
    ]);
  }

  const requestBodyValidationResult = UpdateTweetSchema.safeParse(req.body);

  if (!requestBodyValidationResult.success) {
    throw new ApiError(
      400,
      requestBodyValidationResult.error.errors[0]?.message,
      requestBodyValidationResult.error.errors.map((err) => err.message)
    );
  }

  const requestBody = requestBodyValidationResult.data;

  const updatedTweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: _id,
    },
    {
      $set: {
        content: requestBody.content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedTweet) {
    throw new ApiError(
      404,
      "Either the tweet does not exist or you do not have permissions to perform the give task.",
      [
        "Either the tweet does not exist or you do not have permissions to perform the give task.",
      ]
    );
  }

  return res.status(200).json(
    new ApiResponse(200, {
      tweet: updatedTweet,
    })
  );
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  const { _id } = req.user;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Provide a valid ObjectID as tweetId", [
      "Provide a valid ObjectID as tweetId",
    ]);
  }

  const deletedTweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: _id,
  });

  if (!deletedTweet) {
    throw new ApiError(
      404,
      "Either the tweet does not exist or you do not have permissions to perform the give task.",
      [
        "Either the tweet does not exist or you do not have permissions to perform the give task.",
      ]
    );
  }

  await Like.deleteMany({
    tweet: deletedTweet._id.toString(),
  });

  return res.status(200).json(
    new ApiResponse(200, {
      tweet: deletedTweet,
    })
  );
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
