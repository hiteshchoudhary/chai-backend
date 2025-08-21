import { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body; // Extracts the tweet content from the request body
  const ownerId = req.user._id; // Get the logged-in user's ID

  // If no content is provided, throw an error.
  if (!content) {
    throw new ApiError(400, "Tweet content should not be empty");
  }

  //  Creating a New Tweet
  /*
     - `Tweet.create({ content, owner: ownerId })`
       This creates a new document in the database with:
         - `content`: The actual text of the tweet.
         - `owner`: The user who posted it (linked via the user's ID).
     - MongoDB automatically assigns a unique `_id` to the tweet.
  */
  const newTweet = await Tweet.create({ content, owner: ownerId });

  // Error Handling: If something goes wrong with saving to the database
  if (!newTweet) {
    throw new ApiError(500, "Something went wrong while creating a tweet");
  }

  // Success Response
  return res
    .status(201)
    .json(new ApiResponse(201, newTweet, "Tweet created successfully"));

  /*
How does this work in an app? - Notes:

👉 When a user submits a tweet via a frontend app (like a form or a button press):
   - The frontend sends a `POST` request to the backend with `content`.
   - This controller checks if content exists, then creates a new tweet.
   - The tweet is saved in MongoDB, associated with the logged-in user.
   - A success response is sent back with the newly created tweet.
*/
});

const getUserTweets = asyncHandler(async (req, res) => {
  // Extracting userId from request parameters
  const { userId } = req.params;

  // We need to ensure the provided user ID is a valid MongoDB ObjectId
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Fetch tweets from the database
  // We query the Tweet collection for tweets where the 'owner' field matches the userId
  // We also sort the tweets by 'createdAt' in descending order (-1) to show the latest tweets first
  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

  //  Handle case where no tweets are found
  if (!tweets || tweets.length === 0) {
    throw new ApiError(404, "Tweets are not found");
  }

  // Return the response with tweets
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));

  /*
Fetching User Tweets - Notes:

👉 Why do we use `.sort({ createdAt: -1 })`?
   - Sorting ensures that the newest tweets appear first in the response.
   - `-1` means descending order, so the most recent tweets are shown first.

*/
});

const updateTweet = asyncHandler(async (req, res) => {
  // Extract tweetId from request parameters
  const { tweetId } = req.params;

  // Extract updated tweet content from request body
  const { content } = req.body;

  // Get the ID of the currently authenticated user
  const userId = req.user._id;

  /*
    Tweet Updating Logic:
    - `tweetId`: The ID of the tweet the user wants to update.
    - `content`: The new content that will replace the existing tweet.
    - `userId`: The ID of the user attempting to update the tweet.
  */

  // Validate if tweetId is a proper MongoDB ObjectId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  /*
     Fetch the existing tweet from the database:
    - `Tweet.findById(tweetId)`: Searches for the tweet using its unique ID.
  */
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  /*
    - Users should only be able to edit their own tweets.
    - Convert ObjectIds to strings before comparing.
  */
  if (tweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only update your own tweets");
  }

  /*
     Update the Tweet:
    - `findByIdAndUpdate()`: Finds a tweet by its ID and updates its content.
    - `$set`: Specifies the fields to update.
    - `{ new: true }`: Ensures the function returns the updated tweet, not the old one.
  */
  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Something went wrong while updating the tweet");
  }

  /*
     Responding to the Client:
    - Returns the updated tweet data.
  */
  res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));

  /*

 Updating a Tweet - Notes:

  👉 Why fetch the tweet first before updating?
     - Ensures the tweet exists before attempting an update.
     - Allows us to verify the tweet owner before making changes.

  👉 Why is `content` from `req.body` used inside `$set`?
     - The extracted content is the new tweet content replacing the old one.
     - It ensures only the content field is updated while keeping other tweet data intact.

*/
});

const deleteTweet = asyncHandler(async (req, res) => {
  // Extract the tweetId from request parameters (The ID of the tweet the user wants to delete.)
  const { tweetId } = req.params;

  // Get the currently logged-in user's ID
  const userId = req.user._id;

  // Validate if tweetId is a proper MongoDB ObjectId
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  /*
   Find the tweet in the database.
    - We need to check if the tweet exists before trying to delete it.
  */
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  /*
   Check if the user owns the tweet.
    - Only the owner of the tweet should be able to delete it.
    - Convert ObjectIds to strings before comparing (MongoDB IDs are objects).
  */
  if (tweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own tweets");
  }

  /*
    Delete the tweet from the database.
    - `findByIdAndDelete(tweetId)`: Finds the tweet by its ID and deletes it.
  */
  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(500, "Something went wrong while deleting a tweet");
  }

  // Send a success response back to the user.
  res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));

  /*

  Tweet Deletion - Notes: 
 
  👉 Why verify if the tweet exists before deleting?
     - Prevents errors when trying to delete something that isn't there.
     - Avoids unnecessary database operations.

  👉 Why use `findByIdAndDelete()` instead of `deleteOne()`?
     - `findByIdAndDelete()` finds a document by `_id` and removes it in one step.
     - `deleteOne({ _id: tweetId })` works too, but we already have the exact `_id`, so it’s simpler.
     
*/
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
