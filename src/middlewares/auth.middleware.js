import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

/*
  
  What is this middleware doing?
  - It verifies the user's access token before allowing them to access protected routes.
  - If the token is valid, it attaches the user info to `req.user` and moves to the next middleware.
  - If the token is missing or invalid, it throws an error.
*/
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    /*
       Step 1: Extract the Token 
      
      - First, we check if the token is stored in cookies (`req.cookies?.accessToken`).
      - If it's not in cookies, we check the `Authorization` header.
      - If it's in the header, we remove the "Bearer " part to get the actual token.
    */
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request - No token found");
    }

    /*
       Step 2: Decode & Verify Token 
      
      - We use `jwt.verify()` to decode the token and ensure it hasn’t been tampered with.
      - It requires the secret key (`ACCESS_TOKEN_SECRET`) that was used to sign the token.
      - If verification fails, it will throw an error automatically.
    */
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    /*
       Step 3: Fetch User from Database 
      
      - Using the `_id` from the decoded token, we fetch the user from the database.
      - `.select("-password -refreshToken")` ensures that we exclude sensitive data.
    */
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token - User not found");
    }

    /*
       Step 4: Attach User to `req.user` and Pass Control 
      
      - If everything is fine, we attach the user to `req.user`.
      - `next()` allows the request to proceed to the next middleware or controller.
    */

    /* 
         `req.user = user;` means:
            - We attach the fetched user object to `req.user`
            - This makes the authenticated user available to all following middleware & route handlers
            - Example: If a protected route wants to know who is logged in, it can simply access `req.user`
        */
    req.user = user;
    next();
  } catch (error) {
    /*     
      - If anything goes wrong (invalid token, expired token, user not found), we throw an `ApiError`.
    */
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

/*
   auth Middleware - Notes: 
  
  👉 Why check both `cookies` and `Authorization` header?
     - Some clients store tokens in cookies, while others send them in headers.
     - This ensures we support both methods.
  
  👉 Why remove `Bearer ` from the token?
     - Many APIs send tokens in the format `Bearer <token>`.
     - We need only the `<token>` part to verify it.
  
  👉 Why use `.select("-password -refreshToken")`?
     - Security best practice: Never expose sensitive user data.
     - Even though we attach `req.user`, we exclude unnecessary fields.
  
  👉 What happens if the token is expired?
     - `jwt.verify()` will automatically throw an error if the token is expired.
     - The error message will be passed to `ApiError`, making debugging easier.
  
  👉 Why use `asyncHandler()`?
     - It helps handle asynchronous errors inside Express middleware without needing multiple try-catch blocks.
  
*/
