import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  // Function to get comments for a specific video

  /*
    Step 1: Extract videoId from request parameters
    - req.params contains route parameters like videoId (e.g., /video/:videoId/comments)
  */
  const { videoId } = req.params;

  /*
    Step 2: Extract pagination details from query parameters
    - If the client sends ?page=2&limit=5, then:
      - page = 2 (fetch second page of comments)
      - limit = 5 (fetch 5 comments per page)
    - If no values are provided, default to page 1 and limit 10
  */
  const { page = 1, limit = 10 } = req.query;

  /*
    Step 3: Validate videoId
    - MongoDB uses ObjectId format, so we need to check if videoId is a valid ObjectId.
    - If the ID is invalid, we throw an error.
  */
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  console.log("Video ID:", videoId, "Type:", typeof videoId); // Debugging log

  /*
    Step 4: Convert videoId to ObjectId
    - MongoDB stores IDs as ObjectId, so we need to convert videoId (string) to ObjectId format.
    - This ensures correct matching in the database.
  */
  const videoObjectId = new mongoose.Types.ObjectId(videoId);

  /*
    Step 5: Fetch comments using aggregation

  */
  const comments = await Comment.aggregate([
    {
      /*
        Step 5.1: Match comments related to the specified video ID
        - This filters out only comments that belong to the requested video.
      */
      $match: {
        video: videoObjectId,
      },
    },
    {
      /*
        Step 5.2: Lookup video details
        - Joins the "videos" collection to get details about the video which has the comment
        - The result is stored as "CommentOnWhichVideo".
      */
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "CommentOnWhichVideo",
      },
    },
    {
      /*
        Step 5.3: Lookup user details (comment owner)
        - Joins the "users" collection to get details about the user who posted the comment.
        - The result is stored as "OwnerOfComment".
      */
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "OwnerOfComment",
      },
    },

    {
      /*
        Step 5.4: Restructure the output
        - $project is used to include only required fields.
        - $arrayElemAt extracts the first (and only) element from "OwnerOfComment" and "CommentOnWhichVideo".
        - This avoids unnecessary array nesting in the result.
      */
      $project: {
        content: 1, // Include the comment content
        owner: {
          $arrayElemAt: ["$OwnerOfComment", 0], // Extract first element from owner array
        },
        video: {
          $arrayElemAt: ["$CommentOnWhichVideo", 0], // Extract first element from video array
        },
        createdAt: 1, // Include timestamp
      },
    },

    {
      /*
        Step 6: Apply pagination
        - $skip ignores comments from previous pages ((page - 1) * limit).
        - $limit restricts the number of comments per request to the specified limit.
      */
      $skip: (page - 1) * parseInt(limit),
    },

    {
      $limit: parseInt(limit),
    },
  ]);
  console.log(comments); // Debugging log to check fetched comments

  /*
    Step 7: Check if any comments exist
  */
  if (!comments?.length) {
    throw new ApiError(404, "Comments are not found");
  }

  /*
    Step 8: Send response with comments data
  */
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));

  /*
 Comment Fetching Notes:


👉 Why do we use $lookup twice?
 - First $lookup fetches video details (to know which video the comment is on).
 - Second $lookup fetches the user details (who wrote the comment).

👉 Why do we use $arrayElemAt inside $project?
 - $lookup returns an array, even if there's only one matching document.
 - $arrayElemAt extracts the first element, so we get a single object instead of an array.
 
👉 Why do we use pagination with $skip and $limit?
 - $skip ignores previous pages of comments ((page - 1) * limit).
 - $limit ensures we don't fetch too many comments at once, improving performance.
 - This prevents overwhelming the database and speeds up response time.
*/
});

const addComment = asyncHandler(async (req, res) => {
  /*
    Extracting video ID from request parameters
    - The user is trying to comment on a specific video, so we get the video ID from the URL
  */
  const { videoId } = req.params;

  /*
    Extracting content from request body
    - The comment content is provided in the request body, so we extract it
  */
  const { content } = req.body;

  /*
    Checking if the provided videoId is a valid MongoDB ObjectId
    - MongoDB uses ObjectId as unique identifiers, and we need to ensure it's a valid format
    - If not valid, we throw an error to prevent invalid database queries
  */
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  /*
    Checking if the user is logged in
    - Comments can only be added by authenticated users
    - If no user info is found in the request, we throw an error
  */
  if (!req.user) {
    throw new ApiError(401, "User needs to be logged in");
  }

  /*
    Checking if the content is empty
    - A comment cannot be empty
    - If there's no content, we throw an error
  */
  if (!content) {
    throw new ApiError(400, "Empty or null fields are invalid");
  }

  /*
    Creating the new comment in the database
    - The comment document is created with:
      - 'content': the text entered by the user
      - 'owner': the user who wrote the comment
      - 'video': the video on which the comment is posted
    - MongoDB's 'create' method inserts this document into the 'comments' collection
  */
  const addedComment = await Comment.create({
    content,
    owner: req.user?.id, // Linking comment to the logged-in user
    video: videoId, // Linking comment to the video
  });

  /*
    Checking if the comment was successfully created
    - If something goes wrong during creation, return a server error
  */
  if (!addedComment) {
    throw new ApiError(500, "Something went wrong while adding comment");
  }

  /*
    Sending a success response
    - If everything is successful, return the newly added comment with a success message
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, addedComment, videoId, "Comment added successfully")
    );

  /*
 Commenting System Notes:


  👉 Why check if the user is logged in?
     - Comments should only be made by registered users.
     - Imagine a chat where random anonymous people spam messages. Not fun, right?

  👉 Why check if content is empty?
     - A comment must have text, otherwise it wouldn't make sense!
     - It’s like sending a blank text message to a friend—they’d be confused!

  👉 Why store 'owner' and 'video' in the comment?
     - This allows us to track who made the comment and on which video.
     - If we didn't store this info, we'd have random comments with no way to know where they belong.
*/
});

const updateComment = asyncHandler(async (req, res) => {
  /*
    Extracting commentId from request parameters
    - The user wants to update a specific comment, so we get its ID from the URL
  */
  const { commentId } = req.params;

  /*
    Extracting new content from request body
    - This is the updated comment text that the user wants to save
  */
  const { content } = req.body;

  /*
    Checking if the provided commentId is a valid MongoDB ObjectId

  */
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  /*
    Checking if the user is logged in
    - Only authenticated users can update their comments

  */
  if (!req.user) {
    throw new ApiError(401, "User must be logged in");
  }

  /*
    Checking if the updated content is empty
    - Comments must have some text
  */
  if (!content) {
    throw new ApiError(400, "Comment cannot be empty");
  }

  /*
    Finding and updating the comment in the database
    - We search for a comment with:
      - '_id': matches the given comment ID
      - 'owner': must match the logged-in user's ID (so users can only update their own comments)
    - If found, update the 'content' field
    - { new: true } ensures the updated comment is returned
  */
  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: req.user._id, // Ensures users can only update their own comments
    },
    {
      $set: {
        content,
      },
    },
    { new: true } // Return the updated comment instead of the old one
  );

  /*
    Checking if the comment was successfully updated
    - If no comment was found or something went wrong, return an error
  */
  if (!updatedComment) {
    throw new ApiError(500, "Something went wrong while updating the comment");
  }

  /*
    Sending a success response
    - If everything works, return the updated comment with a success message
  */
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment successfully updated"));

  /*
 Updating Comments Notes:

  
  👉 Why check if the user is logged in?
     - Only authenticated users should be able to modify their own comments.
     - Otherwise, someone could edit another user's comments — big security risk!

  👉 Why check for both '_id' and 'owner' when updating?
     - We don’t want users to edit other people’s comments.
     - This ensures that only the original commenter can update their comment.
*/
});

const deleteComment = asyncHandler(async (req, res) => {
  // Extracting commentId from the request parameters to delete a specific comment
  const { commentId } = req.params;

  // Check if the commentId is a valid MongoDB ObjectId
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  // Check if the user is logged in
  if (!req.user) {
    throw new ApiError(401, "User must be logged in");
  }

  /*
    Find the comment by its ID and ensure that the logged-in user is the owner
    - Only the owner of the comment should be able to delete it
    - findOneAndDelete() finds the comment and removes it in one step
  */
  const deletedCommentDoc = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user._id, // Ensuring only the owner can delete their comment
  });

  // If no comment was found or deleted, throw an error
  if (!deletedCommentDoc) {
    throw new ApiError(500, "Something went wrong while deleting the comment");
  }

  /*
    Successfully deleted the comment, return a response
    - Send back the deleted comment data as a confirmation
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedCommentDoc, "Comment deleted successfully")
    );

  /*
Comment Deletion Process Notes:

👉 Why do we use findOneAndDelete()?
   - It finds the comment and deletes it in one database query.
   - Ensures only the owner of the comment can delete it (security feature!).

👉 What happens if the comment doesn't exist or the user isn't the owner?
   - The operation fails safely without deleting anything.
   - The user gets a clear error message about what went wrong.

*/
});

export { getVideoComments, addComment, updateComment, deleteComment };
