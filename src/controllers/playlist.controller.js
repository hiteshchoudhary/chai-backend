import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  // Extract playlist details from request body
  const { name, description } = req.body;

  /*
    Validate the input:
    - `name` and `description` must be provided.
    - If either is missing, throw a 400 Bad Request error.
  */
  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }

  /*
    Create a new playlist document in the database:
    - `name` and `description` are stored.
    - `owner` is set to the currently logged-in user's ID.
    - `Playlist.create()` inserts a new document.
  */
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  /*
    If the playlist creation fails, return a 500 error.
    - This ensures proper error handling for database issues.
  */
  if (!playlist) {
    throw new ApiError(500, "Something went wrong while creating the playlist");
  }

  /*
    Send a success response:
    - Status 201 indicates successful resource creation.
    - The response includes the newly created playlist.
  */
  return res
    .status(201)
    .json(new ApiResponse(201, playlist, "Playlist created successfully"));

  /*

 Playlist Creation Notes:

👉 What happens when `Playlist.create()` is called?
   - A new document is inserted into the database.
   - The owner's ID is linked to the playlist.
   - Returns the created playlist if successful.

👉 Why store `req.user._id` in `owner`?
   - Ensures only authenticated users can create playlists.
   - Associates playlists with specific users for ownership.

*/
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  // Extract userId from the request parameters
  const { userId } = req.params;

  // Validate if the provided userId is a valid MongoDB ObjectId
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  /*
    Fetch all playlists owned by the specified user.
    - `find({ owner: userId })`: Queries the database for playlists where the `owner` field matches `userId`.
    - If no playlists are found, an empty array is returned.
  */
  const playlists = await Playlist.find({ owner: userId });

  // If no playlists exist for the user, return a 404 error.
  if (!playlists || playlists.length === 0) {
    throw new ApiError(404, "Playlist not found");
  }

  /*
    Send a success response with the retrieved playlists.
    - The `playlists` array contains all playlists belonging to the user.
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, playlists, "User playlists fetched successfully")
    );

  /*

Fetching User Playlists Notes:

👉 How does `Playlist.find({ owner: userId })` work?
   - Searches the `Playlist` collection for documents where the `owner` field matches `userId`.
   - Returns an array of matching playlists or an empty array if none exist.

👉 What happens if no playlists are found?
   - We check `if (!playlists || playlists.length === 0)`, meaning:
     - If `playlists` is `null` or `undefined`, an error is thrown.
     - If `playlists` is an empty array, it means the user has no playlists, so we return a 404 error.

👉 Alternative ways to fetch user playlists?
   - `Playlist.findOne({ owner: userId })`: Returns only the first matching playlist.
   - `Playlist.find({ owner: userId }).limit(5)`: Limits results to 5 playlists.
   - `Playlist.find({ owner: userId }).sort({ createdAt: -1 })`: Sorts playlists by newest first.

 */
});

const getPlaylistById = asyncHandler(async (req, res) => {
  // Extract playlistId from request parameters
  const { playlistId } = req.params;

  // Validate if playlistId is a valid MongoDB ObjectId
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  /*
    Fetch the playlist from the database.
    - `findById(playlistId).populate("videos")`:
      - Finds a playlist by ID.
      - Uses `.populate("videos")` to fetch full video details instead of just their IDs.
  */
  const playlist = await Playlist.findById(playlistId).populate("videos");

  // If no playlist is found, return a 404 error.
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  /*
    Send a success response with the playlist details.
    - The playlist object contains all its details, including videos.
  */
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));

  /*

Fetching a Playlist by ID - Notes:

👉 What does `.populate("videos")` do?
   - By default, MongoDB stores only video IDs in a playlist.
   - `.populate("videos")` replaces IDs with actual video objects.
   - This makes it easier to access video details without extra queries.

👉 Alternative methods to retrieve playlists?
   - `Playlist.findOne({ _id: playlistId })`: Similar but more flexible with filters.
   - `Playlist.findById(playlistId).lean()`: Returns a plain JavaScript object instead of a Mongoose document.
   
 */
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  /*
    Extract playlistId and videoId from request parameters.
    - These IDs represent the playlist and video we want to update.
  */
  const { playlistId, videoId } = req.params;

  // Validate if playlistId and videoId are valid MongoDB ObjectIds.
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  const playlist= await Playlist.findById(playlistId)
  if(req.user._id.toString() != playlist.owner.toString()){
      throw new ApiError(400,"Only Owner is allowed to edit their playlist")
  }

  /*
    Using MongoDB Aggregation to update the playlist:
    1. `$match`: Finds the playlist document with the given playlistId.
    2. `$addFields`: Adds or updates the `videos` array.
       - `$setUnion`: Ensures that the video is added only if it's not already in the array.
       - Converts videoId into an ObjectId before adding.
    3. `$merge`: Updates the existing playlist document in the `playlists` collection.
  */
  const updatedPlaylist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId), // Find the playlist by ID
      },
    },
    {
      $addFields: {
        videos: {
          $setUnion: ["$videos", [new mongoose.Types.ObjectId(videoId)]], // Ensure unique videos
        },
      },
    },
    {
      $merge: {
        into: "playlists", // Update the existing playlist collection
      },
    },
  ]);

  // If no update was made, return an error.
  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found or video already added");
  }

  /*
    Send a success response indicating the video was added.
    - Returns the updated playlist data.
  */
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to playlist successfully"
      )
    );

  /*

 Adding a Video to a Playlist - Notes:

👉 What does `$setUnion` do?
   - Ensures that the `videos` array only contains unique values.
   - If the video is already in the playlist, it won’t be added again.
   - Helps prevent duplicate entries.

👉 How does `$merge` work?
   - Takes the modified playlist and updates the `playlists` collection.
   - If the document exists, it updates it.
   - If the document doesn’t exist, it creates a new one (though in this case, it’s always an update).

👉 Alternative method using `findByIdAndUpdate`
   ```
   const updatedPlaylist = await Playlist.findByIdAndUpdate(
     playlistId,
     { $addToSet: { videos: videoId } }, // $addToSet ensures uniqueness
     { new: true }
   );

   ```
 */
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // Extract playlistId and videoId from request parameters
  const { playlistId, videoId } = req.params;

  // Validate both IDs to make sure they're legit MongoDB ObjectIds
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }

  const playlist= await Playlist.findById(playlistId)
  if(req.user._id.toString() != playlist.owner.toString()){
      throw new ApiError(400,"Only Owner is allowed to edit their playlist")
  }

  /*

    - `findByIdAndUpdate(playlistId, update, options)`:
      - Finds a playlist by its ID.
      - Updates it based on the provided modifications.
    - `$pull`:
      - Removes a specific value from an array.
      - Here, it removes `videoId` from the `videos` array.
    - `new: true`:
      - Ensures we get the updated playlist as a response.

  */
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      new: true,
    }
  );

  // If no playlist is found, return a 404 error.
  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }

  /*
     Success Response:
    - Sends back the updated playlist.
  */
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video removed from playlist successfully"
      )
    );

  /*

Removing a Video from a Playlist - Notes:

👉 How does `$pull` work in MongoDB?
   - `$pull` is a MongoDB operator used to remove specific items from an array.
   - It searches for the given value inside the array and removes it.
   - If the value isn’t found, nothing happens (no errors!).

👉 Why use `findByIdAndUpdate` instead of `.save()`?
   - It’s a direct database update → no need to fetch, modify, then save.
   - More efficient when dealing with large datasets.
   
*/
});

const deletePlaylist = asyncHandler(async (req, res) => {
  // Extract playlistId from request parameters
  const { playlistId } = req.params;

  // Validate if playlistId is a valid MongoDB ObjectId
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist= await Playlist.findById(playlistId)
  if(req.user._id.toString() != playlist.owner.toString()){
      throw new ApiError(400,"Only Owner is allowed to edit their playlist")
  }

  /*
    Delete the playlist from the database using findByIdAndDelete.
    - If the playlist exists, it will be removed from the database.
  */
  const deletedPlaylistDoc = await Playlist.findByIdAndDelete(playlistId);

  // If no playlist is found, return a 404 error.
  if (!deletedPlaylistDoc) {
    throw new ApiError(404, "Playlist not found");
  }

  /*
    Send a success response with the deleted playlist details.
    - The response includes the deleted playlist's data.
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedPlaylistDoc, "Playlist deleted successfully")
    );

  /*

Deleting a Playlist - Notes:

👉 How does `findByIdAndDelete` work?
   - It finds a document by its ID and removes it from the database.
   - If the ID exists, it deletes the document and returns it.
   - If the ID is invalid or not found, it returns `null`.

👉 Alternative ways to delete a playlist?
   - `Playlist.deleteOne({ _id: playlistId })`: Deletes only one matching playlist.
   - `Playlist.findOneAndDelete({ _id: playlistId })`: Similar but allows additional query conditions.

 */
});

const updatePlaylist = asyncHandler(async (req, res) => {
  /*
     Extracting playlistId and new playlist details from the request.
    - `playlistId` is the unique ID of the playlist to be updated.
    - `name` and `description` contain the updated values for the playlist.
  */
  const { playlistId } = req.params;
  const { name, description } = req.body;

  //  Step 1: Validate the playlist ID
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist= await Playlist.findById(playlistId)
  if(req.user._id.toString() != playlist.owner.toString()){
      throw new ApiError(400,"Only Owner is allowed to edit their playlist")
  }

  //  Step 2: Ensure name and description are provided
  if (!name || !description) {
    throw new ApiError(400, "Name or description cannot be empty");
  }

  /*
     Step 3: Find and update the playlist in the database
    - `findByIdAndUpdate` is used to locate and modify the playlist document.
    - `$set: { name, description }` updates the playlist with new values.
    - `{ new: true }` ensures the updated document is returned.
  */
  const updatedPlaylistDoc = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name,
        description,
      },
    },
    {
      new: true,
    }
  );

  //  If the playlist is not found, return a 404 error.
  if (!updatedPlaylistDoc) {
    throw new ApiError(404, "Playlist not found");
  }

  /*
     Step 4: Send a success response
    - The updated playlist is returned in the response.
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedPlaylistDoc, "Playlist updated successfully")
    );

  /*

Updating a Playlist - Notes:

  👉 How does `findByIdAndUpdate` work?
     - It finds a document by ID and updates it in a single operation.
     - `{ new: true }` makes sure the updated document is returned instead of the old one.

  👉 What’s an alternative way to update?
     - `Playlist.findOneAndUpdate({ _id: playlistId }, { name, description }, { new: true })`
     - This works similarly but allows more complex queries.
     
*/
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};

