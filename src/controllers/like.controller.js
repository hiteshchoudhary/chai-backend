import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  // Extract videoId from request parameters (The ID of the video that the user wants to like/unlike)
  const { videoId } = req.params;

  // Get the userId of the currently authenticated user
  const userId = req.user._id;

  // Validate if videoId is a proper MongoDB ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  /*
     Check if the User Already Liked the Video:
      - This checks if there's already a like from this user on this video.
  */
  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: userId,
  });

  /*
     Toggle Like Logic:
    - If the user already liked the video, remove the like (Unlike it).
    - If the user hasn't liked it yet, create a new like (Like it).
  */
  if (existingLike) {
    // Remove the existing like
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, existingLike, "Video unliked successfully"));
  }

  // If no like exists, create a new like
  const likeVideo = await Like.create({
    video: videoId,
    likedBy: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, likeVideo, "Video liked successfully"));

  /*
  Toggling Likes - Notes: 

  👉 Why use `findOne()` before creating a new like?
     - We need to check if the user has already liked the video.
     - Prevents duplicate likes, ensuring one user can only like a video once.

  👉 Why use `findByIdAndDelete()` instead of `deleteOne()`?
     - `findByIdAndDelete()` directly removes a document by `_id` in one step.
     - `deleteOne({ ... })` works too, but we already have the exact `_id`, so it's faster.

*/
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  // Extract commentId from request parameters
  const { commentId } = req.params;

  // Get the userId from the authenticated user
  const userId = req.user._id;

  // Validate if commentId is a proper MongoDB ObjectId
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  /*
    🔎 Check if Like Already Exists:
      - Searches for an existing like where the user has already liked the comment.
  */
  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: userId,
  });

  if (existingLike) {
    // Remove the existing like
    await Like.findByIdAndDelete(existingLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, existingLike, "Comment unliked successfully"));
  }

  /*
    Creating a Like Entry:
    - `comment: commentId` → Associates the like with the specific comment.
    - `likedBy: userId` → Stores the user who performed the like action.
    
  */
  const likeComment = await Like.create({
    comment: commentId, // Linking the like to the specific comment
    likedBy: userId, // Storing which user liked this comment
  });

  return res
    .status(201)
    .json(new ApiResponse(201, likeComment, "Comment liked successfully"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  // This controller has same logic explanation as above

  const { tweetId } = req.params;

  const userId = req.user._id;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: userId,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);

    return res
      .status(200)
      .json(new ApiResponse(200, existingLike, "Tweet unliked successfully"));
  }

  const likeTweet = await Like.create({
    tweet: tweetId,
    likedBy: userId,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, likeTweet, "Tweet liked successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  // Extract the user ID from the authenticated request
  const userId = req.user._id;

  /*

    - We are querying the `Like` model to find all likes where:
      - The `likedBy` field matches the user's ID (meaning videos liked by the user)
  */
  const likedVideos = await Like.find({
    likedBy: userId, // Only fetch likes made by this user

    /*
      What does `$exists: true` do?
      - This ensures that the `video` field is present in the document.
      - Why? Because the `Like` collection stores likes for multiple entities (e.g., tweets or comments).
      - Without this check, we might accidentally return likes for comments and tweets instead of videos.
    */
    video: { $exists: true },
  }).populate("video", "_id title url"); // Populate the video details

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );

  /*

Liked Videos Query - Notes:
  
  👉 What does `likedBy: userId` do?
     - Filters the `Like` collection to only include likes made by this user.
     - Without this filter, we'd get all likes from all users (which we don’t want).
  
  👉 What is `video: { $exists: true }`?
     - Ensures that we only fetch likes that are related to videos.
     - Without this, we'd also fetch likes on comments and tweets, which is not the goal here.
  
  👉 Why use `.populate()`?
     - The `Like` model only stores a reference id to the liked video.
     - Using `.populate("video", "_id title url")` replaces that ID with actual video data.
     - This means the response includes useful info like `title` and `url`, not just an ID.
  
*/
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
