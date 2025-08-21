import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { getVideoDuration } from "../utils/ffmpeg.js";

const getAllVideos = asyncHandler(async (req, res) => {
  // Extracting query parameters from the request
  const {
    page = 1, // Default page number is 1 if not provided
    limit = 10, // Default limit per page is 10
    query = "", // Default query is an empty string
    sortBy = "createdAt", // Default sorting field is "createdAt"
    sortType = "desc", // Default sorting order is descending
    userId, // User ID (optional, to filter videos by a specific user)
  } = req.query;

  // Checking if the user is logged in
  if (!req.user) {
    throw new ApiError(401, "User needs to be logged in");
  }

  // Constructing the match object to filter videos
  const match = {
    ...(query ? { title: { $regex: query, $options: "i" } } : {}), // If query exists, match titles that contain the search term (case-insensitive)
    ...(userId ? { owner: mongoose.Types.ObjectId(userId) } : {}), // If userId exists, filter videos by that owner
  };

  const videos = await Video.aggregate([
    {
      $match: match, // Filtering videos based on the match criteria
    },

    {
      /*
        $lookup: Joins data from the "users" collection
        - Fetches user details based on the "owner" field in the videos collection
        - This allows us to include user information with each video
      */
      $lookup: {
        from: "users", // Collection to join with
        localField: "owner", // Matching "owner" field in the videos collection
        foreignField: "_id", // Matching "_id" field in the users collection
        as: "videosByOwner", // The resulting user data will be stored under "videosByOwner"
      },
    },

    {
      /*
        $project: Selecting only the necessary fields to return in the response

      */
      $project: {
        videoFile: 1, // Video file link
        thumbnail: 1, // Thumbnail image link
        title: 1, // Video title
        description: 1, // Video description
        duration: 1, // Video duration
        views: 1, // Number of views
        isPublished: 1, // Whether the video is published or not
        owner: {
          $arrayElemAt: ["$videosByOwner", 0], // Extracts the first user object from the array
        },
      },
    },

    {
      /*
        $sort: Sorting videos based on the specified field
        - If sortType is "desc", sort in descending order (-1)
        - If sortType is "asc", sort in ascending order (1)
      */
      $sort: {
        [sortBy]: sortType === "desc" ? -1 : 1,
      },
    },

    {
      /*
        $skip: Skipping records for pagination
        - Formula: (page number - 1) * limit
        - If page = 2 and limit = 10, skips (2-1) * 10 = 10 records
      */
      $skip: (page - 1) * parseInt(limit),
    },

    {
      /*
        $limit: Limits the number of results per page
        - Ensures that the number of results does not exceed the "limit" value
      */
      $limit: parseInt(limit),
    },
  ]);

  // If no videos are found, throw an error
  if (!videos?.length) {
    throw new ApiError(404, "Videos are not found");
  }

  // Sending the response with a success message
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));

  /*
 Video Fetching Process Notes:

  👉 Why do we use $regex for query search?
     - $regex allows partial matching (e.g., searching "fun" will find "funny video").
     - $options: "i" makes it case-insensitive (e.g., "FUN" and "fun" are treated the same).

  👉 What is $lookup and why do we need it?
     - $lookup helps us fetch user details related to each video.
     - Without this, we'd have to make multiple queries to get the same info!

  👉 Why do we use pagination ($skip and $limit)?
     - Instead of loading ALL videos at once (which would be slow), we fetch them in chunks.
     - $skip skips already displayed videos, and $limit ensures we only fetch a limited number.

  👉 What happens if there are no videos found?
     - If the database has no videos matching the filters, we send a 404 error.
     - This prevents sending an empty list without explanation.
*/
});

const publishAVideo = asyncHandler(async (req, res) => {
  // Extracting required fields from request body
  const { title, description, owner } = req.body;

  // Validate that the title is not empty
  if (!title) {
    throw new ApiError(400, "Title should not be empty");
  }
  // Validate that the description is not empty
  if (!description) {
    throw new ApiError(400, "Description should not be empty");
  }

  // Extract the video file path from the uploaded files
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }

  // Extract the thumbnail file path from the uploaded files
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  try {
    // Get the duration of the video file before uploading
    const duration = await getVideoDuration(videoFileLocalPath);

    // Upload the video file to Cloudinary and get the URL
    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    if (!videoFile) {
      throw new ApiError(400, "Cloudinary Error: Video file is required");
    }

    // Upload the thumbnail image to Cloudinary and get the URL
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new ApiError(400, "Cloudinary Error: Thumbnail is required");
    }

    // Store video details in the database
    const videoDoc = await Video.create({
      videoFile: videoFile.url, // Cloudinary URL of the video file
      thumbnail: thumbnail.url, // Cloudinary URL of the thumbnail
      title,
      description,
      owner: req.user?._id, // ID of the user who uploaded the video
      duration, // Duration of the video (in seconds)
    });

    console.log(` Title: ${title}, Owner: ${owner}, duration: ${duration}`);

    // If video creation fails, throw an error
    if (!videoDoc) {
      throw new ApiError(500, "Something went wrong while publishing a video");
    }

    // Send a success response with the video details
    return res
      .status(201)
      .json(new ApiResponse(201, videoDoc, "Video published Successfully"));
  } catch (error) {
    // Handle errors and send a 500 response if something goes wrong
    throw new ApiError(500, error);
  }

  /*
 Video Publishing Notes:

👉 Why do we upload the video and thumbnail to Cloudinary?
   - Storing large video files on the server isn't scalable.
   - Cloudinary provides a CDN, making videos load faster.

👉 Why store the duration in the database?
   - Duration helps in displaying video length without reprocessing the file.
   - It improves user experience and optimizes video streaming.
*/
});

const getVideoById = asyncHandler(async (req, res) => {
  // Extract the videoId from request parameters
  const { videoId } = req.params;

  // Validate if the provided videoId is a valid MongoDB ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  /* 
     Query the database to find the video by its ID.
    - The `findById` method is used to retrieve a specific document using its _id.
    - `populate("owner", "name email")` fetches additional details about the video's owner.
      - Instead of just storing the owner's ID, this will return their name and email too.
      - This is helpful for frontend applications that want to display the owner's info.
  */
  const video = await Video.findById(videoId).populate("owner", "name email");

  // If the video does not exist, return a 404 error.
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Send a success response with the video details.
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));

  /*
 Video Retrieval Notes:

👉 What does `.populate("owner", "name email")` do?
   - By default, the `owner` field in the video document only contains the owner's `_id`.
   - `populate()` replaces this ID with an actual object containing the owner's `name` and `email`.
   - This reduces extra API calls from the frontend to fetch user details separately.
*/
});

const updateVideo = asyncHandler(async (req, res) => {
  // Extract videoId from request parameters
  const { videoId } = req.params;

  // Extract title and description from request body
  const { title, description } = req.body;

  // Validate if the provided videoId is a valid MongoDB ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Create an object to hold updateData for updating title, description and thumbnail(thumbnail will be appended later)
  let updateData = { title, description };

  /*
    If a new thumbnail is uploaded:
    - Extract the file path from request.
    - Ensure the file path is valid.
    - Upload the file to Cloudinary.
    - If the upload is successful, update the thumbnail URL.
  */
  if (req.file) {
    const thumbnailLocalPath = req.file.path;

    if (!thumbnailLocalPath) {
      throw new ApiError(400, "Thumbnail file is missing");
    }

    // Upload the thumbnail to Cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
      throw new ApiError(400, "Error while uploading thumbnail");
    }

    // Add the new thumbnail URL to the updateData
    updateData.thumbnail = thumbnail.url;
  }

  /*
    Update the video document in the database:
    - `findByIdAndUpdate` searches for the video by its ID.
    - `$set: updateData` updates only the provided fields.
    - `{ new: true, runValidators: true }`
      - `new: true` returns the updated document instead of the old one.
      - `runValidators: true` ensures data validation rules are applied.
  */
  const updatedVideo = await Video.findByIdAndUpdate(
    { _id:videoId , owner:req.user._id},
    { $set: updateData },
    { new: true, runValidators: true }
  );

  // If the video is not found, return error.
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found or user is not the author");
  }

  // Send a success response with the updated video details.
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));

  /*

    Video Update Notes:

👉 Why do we use `findByIdAndUpdate` instead of `save()`?
   - `findByIdAndUpdate` allows us to update only specific fields, reducing unnecessary data writes.
   - `save()` is useful when we want to modify and validate an entire document.

👉 Why do we check for `req.file` before updating the thumbnail?
   - Not all updates require a new thumbnail, so we update it only if a new file is provided.
   - This prevents unnecessary file uploads and saves storage space.

👉 What happens if Cloudinary upload fails?
   - The function throws an error before making any database changes, ensuring data integrity.
   - This prevents storing an invalid or missing thumbnail URL in the database.

👉 Why use `{ new: true, runValidators: true }`?
   - `new: true`: Returns the updated document immediately after modification.
   - `runValidators: true`: Ensures any schema validation rules (like required fields) are enforced.
   
   */
});

const deleteVideo = asyncHandler(async (req, res) => {
  // Extract the videoId from the request parameters
  const { videoId } = req.params;

  // Validate if the provided videoId is a valid MongoDB ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  /*
        Delete the video from the database.
    - `findByIdAndDelete(videoId)`: Finds a video by its ID and removes it.
    - If the video does not exist, `deletedVideo` will be null.
  */
  const deletedVideo = await Video.findByIdAndDelete({ _id:videoId , owner:req.user._id});

  // If no video was found to delete, return a 404 error.
  if (!deletedVideo) {
    throw new ApiError(404, "Video not found or user is not the author");
  }

  // Send a success response with the deleted video details.
  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));

  /*

  Video Deletion Notes:

👉 What happens when `findByIdAndDelete(videoId)` is called?
   - The function searches for a document with the given ID.
   - If found, it deletes the document and returns its details.
   - If not found, it returns `null`, triggering a 404 error.

👉 Why do we return the deleted video details?
   - Helps confirm what was deleted.
   - Useful for logging and debugging purposes.
   - Can be used in UI to show a confirmation message.

👉 Alternative ways to delete a video in MongoDB?
   - `deleteOne({ _id: videoId })`: Deletes a single document.
   - `deleteMany({ owner: userId })`: Deletes multiple documents owned by a user.
   - `findOneAndDelete({ _id: videoId })`: Similar but returns only specific fields.

*/
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  /*
    Extract the videoId from the request parameters.
    - This is the ID of the video whose publish status we want to toggle.
  */
  const { videoId } = req.params;

  // Validate if the provided videoId is a valid MongoDB ObjectId.
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  /*
    Find the video by its ID.
    - `findById(videoId)`: Fetches the video document if it exists.
    - If the video is not found, we throw a 404 error.
  */
  const video = await Video.findById(videoId);

  if(req.user._id.toString() != video.owner.toString()){
    throw new ApiError(400,"This action is allowed for author only")
  }

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  /*
    Toggle the `isPublished` status of the video.
    - If it's `true`, set it to `false`.
    - If it's `false`, set it to `true`.
  */
  video.isPublished = !video.isPublished;

  // Save the updated video status in the database.
  await video.save();

  /*
    Send a success response with the updated video details.
    - `video` contains the updated publish status.
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, video, "Video publish status toggled successfully")
    );

  /*

 Toggling Publish Status Notes:

👉 What happens when `findById(videoId)` is called?
   - The function searches the database for a document with the given ID.
   - If found, it returns the video document.
   - If not found, we throw a `404` error to indicate the video doesn't exist.

👉 How does toggling `isPublished` work?
   - `video.isPublished = !video.isPublished;`
   - This flips the boolean value (`true` → `false`, `false` → `true`).
   - It effectively acts as a switch between published and unpublished states.

👉 Why do we call `video.save()`?
   - Changes made to a Mongoose document are not saved automatically.
   - `.save()` commits the updated status to the database.

👉 Alternative ways to toggle a boolean field in MongoDB?
   - Using Mongoose's update function:
     ```
     await Video.findByIdAndUpdate(videoId, { $set: { isPublished: !video.isPublished } }, { new: true });

     ```
   - This method is more concise but requires re-fetching the document to get the updated value.
   
 */
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
