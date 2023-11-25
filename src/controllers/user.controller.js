import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get the user details from frontend
  // validate the user  details like not empty or not defined
  // check validation of password, username and email
  // check if the user exists already
  // check for imgaes, check for avatar
  // upload them to cloud storage
  // create user in database
  // create  user object for response and remove password and refresh token from it 
  // check for user creation
  // retun response

  const { fullName, email, userName, password } = req.body;

  // validation for fields
  if (
    [fullName, email, userName, password].some(
      (field) => field?.trim() === "" || field?.trim() === undefined
    )
  ) {
    removeFile(req);
    throw new ApiError(400, "Please fill all the fields");
  }

  //validation for email
  const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regexEmail.test(String(email).toLowerCase())) {
    removeFile(req);
    throw new ApiError(400, "Please enter a valid email");
  }

  // validation for userName
  const regexUserName = /^[a-z0-9_]+$/;
  if (!regexUserName.test(userName)) {
    removeFile(req);
    throw new ApiError(
      400,
      "Username can only contain letters and numbers and  underscores"
    );
  }

  // validation for password
  const regexPassword =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{6,20})/;
  if (!regexPassword.test(password)) {
    removeFile(req);
    throw new ApiError(
      400,
      "Password must contain at least one lowercase letter, one uppercase letter, one number and one special character"
    );
  }

  // Check user exist or not
  const existUser = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (existUser) {
    removeFile(req);
    throw new ApiError(409, "User  already exists");
  }

  // recieve images data using middleware
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    removeFile(req);
    throw new ApiError(400, "Please upload an avatar");
  }

  // uploading image to cloud storage
  const avatar = await uploadfile(avatarLocalPath);
  const coverImage = await uploadfile(coverImageLocalPath);

  if (!avatar) {
    removeFile(req);
    throw new ApiError(400, "some error in image, please try again");
  }

  // create new user in database
  const user = await User.create({
    fullName,
    email,
    userName: userName.toLowerCase(),
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  // remove password, refresh token and watch histroy in response  from database
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -watchHistroy"
  );

  if (!createdUser) {
    removeFile(req);
    throw new ApiError(500, "Something went wrong while registering user");
  }

  // send response to frontend
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "userSuccessfully registered"));
});

export { registerUser };
