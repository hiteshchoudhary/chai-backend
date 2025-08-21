import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const generateAccessAndRefereshTokens = async (userId) => {
  // Function to generate new access & refresh tokens for a user
  try {
    const user = await User.findById(userId);
    // Find the user in the database using their ID

    const accessToken = user.generateAccessToken();
    // Generate a new access token

    const refreshToken = user.generateRefreshToken();
    // Generate a new refresh token

    user.refreshToken = refreshToken; // Store the refresh token in the database
    await user.save({ validateBeforeSave: false });
    // Save the user without triggering other validation rules

    return { accessToken, refreshToken }; // Return the tokens
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }

  /* 

  👉 Why do we generate access and refresh tokens separately?
   - Access tokens expire quickly for security.
   - Refresh tokens last longer and are used to get new access tokens without logging in again.

   👉 Why do we set validateBeforeSave: false?
   - To prevent Mongoose from running unnecessary validations when updating only the refresh token.
*/
};

const registerUser = asyncHandler(async (req, res) => {
  // asyncHandler makes sure we catch errors without breaking the whole app

  // Getting user details from the request body (aka what the frontend sends us)
  const { fullName, email, username, password } = req.body;
  // Example request body:
  // { fullName: "John Doe", email: "john@example.com", username: "john123", password: "mypassword" }

  // Checking if any required field is empty
  // .trim() removes spaces so "   " isn’t counted as valid input
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Checking if this username or email is already taken
  // $or is a MongoDB operator that checks multiple conditions
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // Handling profile pics
  // req.files contains uploaded files; we grab the avatar image (mandatory)
  const avatarLocalPath = req.files?.avatar[0]?.path; // Grabbing the avatar file path

  let coverImageLocalPath; // Setting up a spot for the cover image (if provided)
  if (
    req.files && // Making sure files exist
    Array.isArray(req.files.coverImage) && // Checking if it’s an array (because multiple files can be sent)
    req.files.coverImage.length > 0 // Making sure there’s at least one cover image
  ) {
    coverImageLocalPath = req.files.coverImage[0].path; // Grabbing the path of the first cover image
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Uploading avatar to Cloudinary (fancy cloud storage)
  // Cloudinary returns an object with a URL if successful
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // Uploading cover image (if provided)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  // Making sure the avatar actually uploaded
  if (!avatar) {
    throw new ApiError(400, "Avatar upload failed");
  }

  // Creating a new user in the database
  const user = await User.create({
    fullName,
    avatar: avatar.url, // Saving avatar URL from Cloudinary
    coverImage: coverImage?.url || "", // Saving cover image URL (or empty if none provided)
    email,
    password,
    username: username.toLowerCase(), // Lowercasing username to keep things neat
  });

  // Fetching the newly created user, but without sensitive info (password, refresh token)
  // .select("-password -refreshToken") removes those fields from the returned object
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  // Sending back a success response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));

  /*
TL;DR of what’s happening here:

1. Grab user details from the request.
   Example input:
   { fullName: "Alice Doe", email: "alice@example.com", username: "alice123", password: "securepass" }

2. Check if any field is empty and throw an error if it is.

3. Make sure the username/email isn’t already taken by checking the database.

4. Grab the avatar file (mandatory) and an optional cover image.

5. Upload images to Cloudinary, which returns URLs.

6. Save user data in the database (with uploaded image URLs).

7. Retrieve the user from the database again, but exclude sensitive fields (password, refresh token).

8. Send a success response with the user’s details (minus sensitive info).


👉 Why do we exclude password & refreshToken?
   - Security reasons! We don’t want to expose sensitive info in API responses.

👉 Why do we use .toLowerCase() for the username?
   - To avoid case sensitivity issues, like "JohnDoe" and "johndoe" being treated as different users.

👉 Why do we check if (!avatar) after uploading?
   - In case the upload fails, we don’t want to proceed with a missing profile pic.

👉 Why do we use .some() to check empty fields?
   - Because it quickly checks if *any* field is empty without looping through all of them manually.

👉 Why do we use MongoDB’s $or operator?
   - It lets us check multiple conditions at once, making sure no duplicate username *or* email exists.

👉 Why do we check if coverImageLocalPath exists before uploading?
   - Not everyone uploads a cover image, so we don’t want an error if it’s missing.

👉 Why do we return res.status(201)?
   - 201 means "Created" in HTTP status codes, which is perfect for a successful registration.
*/
});

const loginUser = asyncHandler(async (req, res) => {
  // This function handles user login requests
  // It checks user credentials and returns access & refresh tokens

  const { email, username, password } = req.body; // Extract email, username & password from request
  console.log(email); // Debugging: logs email to see if it was received

  if (!username && !email) {
    // If neither username nor email is provided, throw an error
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], // Search for user by either email or username
  });

  /*

  👉 What is `findOne` in MongoDB?
   - `findOne` is a Mongoose method that searches for a single document in a collection.
   - `$or` operator allows us to find a user by either `email` or `username`.

   */

  if (!user) {
    // If user isn't found, send a 404 error
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  // Check if provided password matches the stored hashed password

  if (!isPasswordValid) {
    // If password is wrong, send a 401 error (Unauthorized)
    throw new ApiError(401, "Invalid user credentials");
  }

  // Generate new access & refresh tokens for the user
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  // Fetch user details but exclude sensitive fields (password, refresh token)

  const options = {
    httpOnly: true, // Prevents JavaScript access to cookies for security or simply users cannot modify the cookies when we set this flag
    secure: true, // Ensures cookies are sent only over HTTPS
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options) // Store access token in HTTP-only cookie
    .cookie("refreshToken", refreshToken, options) // Store refresh token in HTTP-only cookie
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );

  /*
👉 Why do we check for both email & username?
   - Users can log in using either, so we search by both.

👉 Why do we exclude password & refreshToken from the response?
   - To prevent sensitive information from being exposed in API responses.

👉 Why do we hash passwords & check using bcrypt?
   - Storing plain text passwords is insecure. bcrypt allows safe comparisons.

👉 Why do we generate access & refresh tokens on login?
   - Access tokens provide short-term authentication, while refresh tokens allow users to stay logged in.

👉 Why do we store tokens in cookies with httpOnly & secure?
   - httpOnly: Prevents JavaScript-based attacks (e.g., XSS)
   - secure: Ensures cookies are only sent over HTTPS for security.
*/
});

const logoutUser = asyncHandler(async (req, res) => {
  // This function logs out the user by removing their refresh token from the database

  await User.findByIdAndUpdate(
    req.user._id, // Find the user by their ID in MongoDB
    {
      $unset: {
        refreshToken: 1, // Removes the refreshToken field from the user document
      },
    },
    {
      new: true, // Ensures the updated document is returned
    }
  );

  /*
   What is findByIdAndUpdate?
  - This is a MongoDB method (via Mongoose) that finds a document by its `_id` and updates it.
  - `$unset` removes a field from the document (in this case, refreshToken).
  - `{ new: true }` ensures we get the updated document after the change.
  */

  const options = {
    httpOnly: true, // Ensures cookies can't be accessed via JavaScript (security measure)
    secure: true, // Ensures cookies are only sent over HTTPS
  };

  return res
    .status(200)
    .clearCookie("accessToken", options) // Remove accessToken cookie
    .clearCookie("refreshToken", options) // Remove refreshToken cookie
    .json(new ApiResponse(200, {}, "User logged Out"));

  /*
 Logout Process Notes:

👉 Why do we unset refreshToken in the database?
   - This ensures the user can't use an old refresh token to get a new access token after logging out.
   - Think of it like taking away someone's membership card when they leave the club!

👉 Why do we clear cookies?
   - Access & refresh tokens are stored in cookies, so clearing them fully logs the user out.
   - No tokens = No access = Secure logout!

*/
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  // This function helps users stay logged in by refreshing their access token.
  // It checks if the refresh token is valid, then issues a new access token.

  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken; // Tries to get refresh token from cookies first, then from request body

  if (!incomingRefreshToken) {
    // If there's no refresh token, the request is not allowed
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    // Step 1: Verify the refresh token using JWT (JSON Web Token)
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET // Uses a secret key to check if the token is valid
    );

    // Step 2: Find the user in the database using the user ID from the token
    const user = await User.findById(decodedToken?._id); // Finds user based on ID stored in the refresh token

    if (!user) {
      // If no user is found, the token is invalid
      throw new ApiError(401, "Invalid refresh token");
    }

    // Step 3: Check if the refresh token provided matches the one stored in the database
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Step 4: Set options for cookies (security settings)
    const options = {
      httpOnly: true,
      secure: true,
    };

    // Step 5: Generate new access & refresh tokens for the user
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    // Step 6: Send the new tokens back to the client
    return res
      .status(200)
      .cookie("accessToken", accessToken, options) // Stores new access token in secure cookie
      .cookie("refreshToken", newRefreshToken, options) // Stores new refresh token in secure cookie
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token"); // Handles token verification errors
  }

  /*
 Deep Dive into Refresh Token Flow:

👉 What’s the purpose of a refresh token?
   - Access tokens expire quickly for security reasons.
   - Refresh tokens allow users to stay logged in without re-entering their password.

👉 Why do we verify the refresh token?
   - To make sure it was created by our server and hasn’t been tampered with.
   - Prevents hackers from generating fake tokens.

👉 Why do we check if the refresh token matches the one in the database?
   - If a hacker steals an old refresh token, they shouldn’t be able to use it.
   - Only the latest refresh token should be valid.

👉 Why do we replace the refresh token every time?
   - If someone steals the refresh token, it becomes useless after the next login.
   - This makes our system more secure.

👉 What happens if a refresh token is missing?
   - The user is logged out and must log in again.
   - Prevents unauthorized access when tokens are missing.

*/
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Extract oldPassword and newPassword from the request body
  const { oldPassword, newPassword } = req.body;

  // Find the user in the database using their ID from the authenticated request
  const user = await User.findById(req.user?._id);

  // Check if the provided old password matches the stored hashed password
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    // If old password is incorrect, throw an error and prevent update
    throw new ApiError(400, "Invalid old password");
  }

  // If old password is correct, update the user's password with the new one
  user.password = newPassword;

  // Save the updated user object in the database without running validations
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));

  /*
  👉 Why do we check oldPassword first?
     - To prevent unauthorized password changes. Only the correct old password allows an update.
  
  👉 Why do we hash the new password before saving? (Handled in Mongoose pre-save middleware)
     - Storing plain text passwords is insecure. Hashing ensures better security.
  
  👉 Why do we use validateBeforeSave: false?
     - We skip schema validations (if any) to ensure quick updates.
  */
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // This function gets the current logged-in user's details and sends them in response
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  /*
  Function to update user's account details (like full name and email)
  It takes data from the request body, updates it in the database, and returns the updated user details
*/

  const { fullName, email } = req.body; // Extracting fullName and email from request body

  // If fullName or email is missing, throw an error
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required"); // 400 means "Bad Request" (user did something wrong)
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id, // Find user by ID
    {
      $set: {
        // Update only the fullName and email fields
        fullName,
        email: email, // Can just be "email" instead of "email: email", but writing it explicitly for clarity
      },
    },
    { new: true } // Ensures we get the updated user details
  ).select("-password"); // Do NOT send the password back in response (security matters!)

  /*
    Finding the user in the database by their ID and updating their fullName and email
    - req.user?._id → This is how we get the logged-in user's ID
    - $set → It's a MongoDB operator that updates specific fields
    - { new: true } → Makes sure we get the updated user data, not the old one
    - .select("-password") → Excludes the password field from the response (safety first!)
  */

  // Send back the updated user data with a success message
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));

  /*
 User Account Updates Notes:

👉 Why use $set instead of replacing the whole document?
   - This updates only specific fields without touching the rest.
   - Think of it like changing just your profile picture instead of making a whole new account!

👉 Why exclude the password in the response?
   - Security reasons! We never want to accidentally expose sensitive data.
   - Even though passwords are hashed, it’s better not to send them at all.
*/
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // Function to update the user's avatar (profile picture)

  const avatarLocalPath = req.file?.path; // Getting the local path of the uploaded file

  // If no file is uploaded, throw an error (we need an image to update the avatar!)
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing"); // 400 means "Bad Request"
  }

  // Find the user in the database using their ID
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found"); // 404 means "User does not exist"
  }

  if (user.avatar) {
    const publicId = user.avatar.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
    await cloudinary.uploader.destroy(publicId); // Delete old avatar from Cloudinary
  }

  /*
    If the user already has an avatar, delete the old one from Cloudinary
    - user.avatar contains the URL of the current avatar (e.g., "https://res.cloudinary.com/.../avatar123.jpg")
    - We need to extract the unique identifier ("avatar123") to delete the correct image
    - .split("/").pop() gets the last part of the URL ("avatar123.jpg")
    - .split(".")[0] removes the file extension (.jpg), leaving just "avatar123"
    - This ensures we delete only the user's previous avatar and not anything else!
  */

  // Upload the new avatar to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // If the upload fails for some reason, throw an error
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const userDoc = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  /*
    Updating the user's avatar in the database
    - $set operator updates only the avatar field without changing other user details
    - { new: true } ensures we return the updated user object
    - .select("-password") ensures the password is not included in the response (security measure)
  */

  // Sending a success response with the updated user details
  return res
    .status(200)
    .json(new ApiResponse(200, userDoc, "Avatar image updated successfully"));

  /*
 Deep Dive into Avatar Updates:


👉 Why do we delete the old avatar from Cloudinary?
   - Prevents unnecessary storage usage and clutter.
   - Think of it like replacing your profile picture on social media – you don’t want 10 old ones hanging around!

👉 How does extracting publicId work?
   - Cloudinary stores images with unique URLs like "https://res.cloudinary.com/.../avatar123.jpg".
   - To delete the right file, we extract "avatar123" using .split("/").pop().split(".")[0].
   - This prevents accidental deletions and ensures we remove only the intended avatar!

👉 Why use $set instead of replacing the entire user document?
   - This updates only the avatar field without affecting other user details.
   - Like changing just your profile picture without resetting your entire account!

*/
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  //This has same explanation as above controller, you can refer 'updateUserAvatar' notes from above.

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Delete old cover image if exists
  if (user.coverImage) {
    const publicId = user.coverImage.split("/").pop().split(".")[0]; // Extract Cloudinary public_id
    await cloudinary.uploader.destroy(publicId);
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on avatar");
  }

  const userDoc = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, userDoc, "Cover image updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // Function to get the profile details of a user's channel
  // This function retrieves user info, subscriber count, subscription count and checks if the logged-in user is subscribed

  const { username } = req.params; // Extracting the username from request parameters

  // If username is missing or just empty spaces, throw an error
  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  /*
    Aggregation Pipeline: A powerful way to process data in MongoDB
    - Here, we're fetching user details along with subscriber and subscription information
  */
  const channel = await User.aggregate([
    {
      /*
        Step 1: Find the user by username
        - 'match' operator filters the documents to only include users with the given username.
      */
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      /*
        Step 2: Fetch all people who have subscribed to this user's channel
        - Think of it like checking who follows you on a social media platform.

        'lookup' operator: Joins data from another collection (like SQL JOIN)
        - Fetching all subscriptions where this user is the "channel"
        - This gives us all the people who have subscribed to this user's channel
      */
      $lookup: {
        from: "subscriptions", // Collection name to join with
        localField: "_id", // Matching user ID in User collection
        foreignField: "channel", // Matching with "channel" field in Subscriptions collection

        as: "subscribers", // The result is stored in "subscribers"
      },
    },
    {
      /*
        Step 3: Fetch all the channels this user has subscribed to
        - This is like checking which YouTube channels you are following.
      */
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber", // Match where this user appears as a "subscriber"
        as: "subscribedTo", // Store the result in a field called "subscribedTo"
      },
    },
    {
      /*
        Step 4: Calculate extra details using 'addFields' operator
        - Count total subscribers
        - Count total channels the user has subscribed to
        - Check if the logged-in user is already subscribed to this channel
      */
      $addFields: {
        subscribersCount: {
          $size: "$subscribers", // Count how many documents (subscribers) are in the "subscribers" array
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo", // Count how many channels this user is following
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // Check if logged-in user's ID exists in the subscriber list
            then: true, // If found, return true (user is subscribed)
            else: false, // Otherwise, return false (user is NOT subscribed)
          },
        },
      },
    },
    {
      /*
        Step 5: Project (select) only the necessary fields to return
        - This reduces data load and keeps responses efficient.
      */
      $project: {
        fullName: 1, // Include full name of the user
        username: 1, // Include username
        subscribersCount: 1, // Include total subscriber count
        channelsSubscribedToCount: 1, // Include total subscribed-to count
        isSubscribed: 1, // Include whether logged-in user is subscribed
        avatar: 1, // Include avatar image
        coverImage: 1, // Include cover image
        email: 1, // Include email
      },
    },
  ]);

  // If no channel is found, return an error
  if (!channel?.length) {
    throw new ApiError(404, "channel does not exist");
  }

  // Sending a success response with the channel data
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );

  /*
 Deep Dive into User Channel Fetching:

👉 Why do we use aggregation instead of a simple find query?
   - Aggregation allows us to fetch and process related data in one go.
   - Instead of making multiple queries (for user, subscribers, and subscriptions), we optimize it into one pipeline!

👉 Why do we use $lookup twice?
   - First $lookup fetches all people subscribed to the user's channel.
   - Second $lookup fetches all channels the user is subscribed to.
   - This way, we get both subscriber and subscription details in a single query.

👉 How does $size help us?
   - $size is used to count the number of documents in an array.
   - We use it to count total subscribers and subscriptions of the user.
   - Think of it like counting how many followers you have on social media!

👉 What is $cond and why do we use it?
   - $cond is like an "if-else" statement in MongoDB.
   - We check if the logged-in user is in the subscriber list using $in.
   - If yes, we return true (meaning the user is subscribed), otherwise false.

👉 Why do we project specific fields?
   - To limit the amount of data returned, reducing unnecessary network load.
   - Sending only relevant data improves efficiency and keeps responses clean!

*/
});

const getWatchHistory = asyncHandler(async (req, res) => {
  // Function to get the watch history of a user
  // This function retrieves the videos a user has watched along with the details of the video owner

  /*
    Step 1: Find the user in the database using aggregation
  */
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id), // Convert user ID to ObjectId and match it in the database
      },
    },

    /*
        Step 1.1: Convert user ID to ObjectId and match it in the database
        - req.user._id is a string representation of the user's ID.
        - MongoDB stores IDs as ObjectId (a special type of ID used for indexing and efficiency).
        - We use 'new mongoose.Types.ObjectId()' to convert the string into an ObjectId.
        - This ensures we can correctly match the user in the database.
        - If we don't do this conversion, MongoDB might not find the user because it's expecting an ObjectId.
      */

    {
      /*
        Step 2: Fetch user's watch history using $lookup
        - The 'watchHistory' field in User contains an array of video IDs the user has watched
        - We use $lookup to match these IDs with actual videos in the 'videos' collection
      */
      $lookup: {
        from: "videos", // Collection where videos are stored
        localField: "watchHistory", // Field in 'User collection' that stores watched video IDs

        foreignField: "_id", // Field in 'Videos collection' that matches the video IDs
        as: "watchHistory", // Store the result in 'watchHistory'
        pipeline: [
          // A sub-pipeline to fetch additional details
          {
            /*
              Step 3: Fetch video owner details
              - Each video has an 'owner' field that stores the ID of the uploader
              - We use $lookup again to match this ID with the 'users' collection
              - This allows us to fetch the owner's details (name, username, avatar)
            */
            $lookup: {
              from: "users", // Collection where user details are stored
              localField: "owner", // Field in 'Users collection' storing owner ID
              foreignField: "_id", // Field in 'Videos collection' to match the owner ID
              as: "owner", // Store the result in 'owner'
              pipeline: [
                // Another sub-pipeline to filter required fields
                {
                  $project: {
                    fullName: 1, // Include owner's full name
                    username: 1, // Include owner's username
                    avatar: 1, // Include owner's avatar
                  },
                },
              ],
            },
          },
          {
            /*
              Step 4: Convert 'owner' array into a single object using $addFields
              - $lookup returns an array, even if there is only one owner
              - We extract the first (and only) owner using $first
            */
            $addFields: {
              owner: {
                $first: "$owner", // Extract first element from 'owner' array
              },
            },
          },
        ],
      },
    },
  ]);

  // Step 5: Send the response with the watch history
  return res
    .status(200) 
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory, // Extract watch history from the first (and only) user in the result
        "Watch history fetched successfully"
      )
    );

  /*
 Deep Dive into Watch History Fetching:

👉 Why do we use aggregation instead of find()? 
   - Aggregation allows us to join multiple collections efficiently.
   - Instead of making separate queries for user, videos and owners, we optimize it into one pipeline.

👉 Why do we use $lookup twice?
   - First $lookup fetches videos from the user's watch history.
   - Second $lookup fetches the owner details of each video.
   - This way, we retrieve all necessary data in one go!

👉 What does $first do in $addFields?
   - $lookup returns an array, even if there's only one matching document.
   - $first extracts the first element, so we don't return an array with one object inside.
   - Think of it like taking a single piece of candy out of a pack instead of carrying the whole pack!

👉 Why do we use $project inside the second $lookup?
   - To select only the necessary fields (fullName, username, avatar) from the user data.
   - This reduces the data size and makes the response more efficient.

👉 Why do we access user[0].watchHistory instead of just user.watchHistory?
   - Aggregation returns an array of results, even if there's only one user.
   - We extract the first user (index 0) and then access their watchHistory.
   - It's like picking the first item from a search result list!
*/
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
