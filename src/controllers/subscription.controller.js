import { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  // Extract channelId from request parameters
  const { channelId } = req.params;

  // Get the subscriber's ID from the authenticated user
  const subscriberId = req.user._id;

  /*
    Subscription Logic:
    - `channelId`: The ID of the channel the user wants to subscribe/unsubscribe from.
    - `subscriberId`: The ID of the currently logged-in user.
  */

  // Validate if channelId is a proper MongoDB ObjectId
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  /*
    Prevent Self-Subscription:
    - A user shouldn't be able to subscribe to their own channel.
    - Convert IDs to strings before comparing (MongoDB IDs are objects).
  */
  if (subscriberId.toString() === channelId.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  /*
     Check if Subscription Already Exists:
      - This looks for an existing record where the user is subscribed to the channel.
  */
  const existingSubscription = await Subscription.findOne({
    subscriber: subscriberId,
    channel: channelId,
  });

  /*
     Toggle Logic:
    - If the subscription exists, the user is already subscribed → Unsubscribe them.
    - If it doesn’t exist, subscribe them.
  */
  if (existingSubscription) {
    // Remove the existing subscription (unsubscribe)
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
  }

  // If no subscription exists, create a new one (subscribe)
  await Subscription.create({ subscriber: subscriberId, channel: channelId });
  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Subscribed successfully"));

  /*

 Toggling Subscription - Notes: 

  👉 What does `Subscription.findOne()` do?
     - Searches for an existing subscription in the database.
     - If found, we remove it (unsubscribe). Otherwise, we create a new one (subscribe).

  👉 Why use `findByIdAndDelete()` instead of `deleteOne()`?
     - `findByIdAndDelete()` finds a document by its `_id` and removes it in one step.
     - `deleteOne({ ... })` works too, but we already have the exact `_id`, so it's faster.

  👉 Why use `.toString()` when comparing ObjectIds?
     - MongoDB IDs are objects, so `===` won’t work directly.
     - `.toString()` ensures they can be compared properly.
     
*/
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  // Extract the channel ID from the authenticated user (the one making the request)
  const channelId = req.user._id;

  // Validate if the channel ID is a valid MongoDB ObjectId
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  /*
    Fetch all subscribers of the channel from the Subscription collection.
    - `Subscription.find({ channel: channelId })` finds all documents where the channel matches the given ID.
    - `.populate("subscriber", "_id name email")` replaces the `subscriber` field (which is just an ID) with full details (ID, name, email).
  */

  const subscribersDocs = await Subscription.find({
    channel: channelId,
  }).populate("subscriber", "_id name email");

  // If no subscribers are found, return a 404 error.
  if (!subscribersDocs) {
    throw new ApiError(404, "No subscribers found for this channel");
  }

  /*
    Send a success response with the list of subscribers.
    - `subscribersDocs` contains the list of all users subscribed to the channel.
  */
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribersDocs, "Subscribers fetched successfully")
    );

  /*
     Breaking it Down: Why We Search by `channel` and Not `subscriber`?
    
    - Consider we have,
     users: a, b, c, d 
     and
     channels (channels are also users): 'Chai aur code', 'Piyush Garg', 'CWH'

    consider,
    * * * * * * * * * * * * * * *  
    * channel -> Chai aur code  *
    * subscriber -> a           *
    * * * * * * * * * * * * * * * 
    
    * * * * * * * * * * * * * * *
    * channel -> Chai aur code  *
    * subscriber -> b           *
    * * * * * * * * * * * * * * * 
    
    * * * * * * * * * * * * * * *
    * channel -> Chai aur code  *
    * subscriber -> c           *
    * * * * * * * * * * * * * * * 
    
    * * * * * * * * * * * * * * *
    * channel -> Piyush Garg      *
    * subscriber -> c           *
    * * * * * * * * * * * * * * * 
    
    * * * * * * * * * * * * * * *
    * channel -> CWH         *
    * subscriber -> c                 *
    * * * * * * * * * * * * * * * 
    
    Now to get channel subscribers of 'chai aur code' channel (this channel is also a user too), we will count the docs where " channel -> Chai aur Code "
    Hence, user 'chai aur code' have total 3 subs   
    
 */

  /* 
 Fetching Channel Subscribers - Notes:

👉 Why do we use `req.user._id` instead of `req.params.channelId`?
   - The authenticated user (the one making the request) is the owner of the channel.
   - This ensures that users can only fetch their own subscribers, preventing unauthorized access.

👉 What does `.populate("subscriber", "_id name email")` do?
   - By default, the `Subscription` collection stores only the `subscriber` ID.
   - `.populate("subscriber", "_id name email")` replaces the ID with actual subscriber details (name, email, etc.).
   - This reduces the need for multiple database queries and makes the response more useful.

👉 Alternative ways to fetch subscribers?
   - `Subscription.find({ channel: channelId }).lean()`: Returns a plain JavaScript object instead of a Mongoose document.
   
 */
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  // Controller to get the list of channels a user has subscribed to

  // Extract the subscriber ID from the authenticated user
  const subscriberId = req.user._id;

  /* 

     - `Subscription.find({ subscriber: subscriberId })`: Finds all records where this user which is coming from "req.user._id " is the subscriber.
     - `populate("channel", "_id name email")`: Fetches the channel details (_id, name, email) for each subscription.
     - Why? Because subscriptions store only IDs. Populating converts them into actual channel objects. */

  const subscribedChannels = await Subscription.find({
    subscriber: subscriberId,
  }).populate("channel", "_id name email");

  // If no subscribed channels found, return an error
  if (!subscribedChannels || subscribedChannels.length === 0) {
    throw new ApiError(404, "No subscribed channels found");
  }

  /*  Why are we checking `subscribedChannels.length === 0`?
     - `.find()` always returns an array. If empty, that means no subscriptions exist.
     - Without this check, the user might receive an empty array instead of a proper message.
  */

  // Return a success response with the list of subscribed channels
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully"
      )
    );

    /*
     Breaking it Down: Why We Search by `subscriber` and Not `channel`, to get the list of channels a user has subscribed to
    
    - Consider we have,
     users: a, b, c, d 
     and
     channels: 'Chai aur code', 'Piyush Garg', 'CWH'

    consider,
    * * * * * * * * * * * * * * *  
    * channel -> Chai aur code  *
    * subscriber -> a           *
    * * * * * * * * * * * * * * * 
    
    * * * * * * * * * * * * * * *
    * channel -> Chai aur code  *
    * subscriber -> b           *
    * * * * * * * * * * * * * * * 
    
    * * * * * * * * * * * * * * *
    * channel -> Chai aur code  *
    * subscriber -> c           *
    * * * * * * * * * * * * * * * 
    
    * * * * * * * * * * * * * * *
    * channel -> Piyush Garg      *
    * subscriber -> c           *
    * * * * * * * * * * * * * * * 
    
    * * * * * * * * * * * * * * *
    * channel -> CWH         *
    * subscriber -> c                 *
    * * * * * * * * * * * * * * * 
    
    Now to get list of channels that user c has subscribed to, we will count the docs where " subscriber -> c "
    Hence, user 'user c' subscribed to total 3 channels   
    
 */
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
