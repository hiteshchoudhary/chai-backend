import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowecase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // cloudinary url
      required: true,
    },
    coverImage: {
      type: String, // cloudinary url
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  // Mongoose middleware (pre-save hook) runs before saving a user to the database
  // This is useful for automatically hashing passwords before storing them

  if (!this.isModified("password")) return next();
  // If the password field hasn’t changed, don’t re-hash it. Just move on.
  // This prevents unnecessary hashing when updating other fields.

  this.password = await bcrypt.hash(this.password, 10);
  // Hash the password with bcrypt before saving (10 = salt rounds for security)

  next(); // Move on to the next middleware or save process
});

userSchema.methods.isPasswordCorrect = async function (password) {
  // This method checks if the provided password matches the hashed password in the database
  return await bcrypt.compare(password, this.password);
  // bcrypt.compare() takes the plain text password and compares it to the hashed one
  // Returns true if they match, false if they don’t
};

userSchema.methods.generateAccessToken = function () {
  // Generates a JWT access token for the user
  return jwt.sign(
    {
      _id: this._id, // Include user ID in the token payload
      email: this.email, // Include email (useful for quick identification)
      username: this.username, // Include username
      fullName: this.fullName, // Include full name
    },
    process.env.ACCESS_TOKEN_SECRET, // Secret key for signing the token
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY, // Token expiration time (e.g., "15m")
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  // Generates a JWT refresh token for keeping the user logged in
  return jwt.sign(
    {
      _id: this._id, // Only store user ID in the refresh token (less exposure)
    },
    process.env.REFRESH_TOKEN_SECRET, // Secret key for signing the refresh token
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY, // Refresh token expiration time (e.g., "7d")
    }
  );
};

/*
👉 Why do we hash the password before saving?
   - So even if the database is compromised, passwords aren’t stored in plain text.

👉 Why do we check if(!this.isModified("password"))?
   - So that password doesn’t get re-hashed when updating other user details.

👉 Why do we use bcrypt.compare() instead of checking passwords directly?
   - Because the stored password is hashed, and bcrypt.compare() handles hashing automatically.

👉 Why do we only include _id in the refresh token?
   - To keep it minimal and reduce exposure of user info.
   
*/

export const User = mongoose.model("User", userSchema);
