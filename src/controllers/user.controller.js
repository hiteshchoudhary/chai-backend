import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import { deleteLocalImage } from "../utils/helpers.js";
import { CLOUD_AVATAR_FOLDER_NAME, CLOUD_COVERPIC_FOLDER_NAME } from "../constants.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const getAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken =  user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave:false});

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens");
    }
}

export const registerUser = asyncHandler(async(req, res) => {
    const {username, email, fullname, password} = req.body;

    if(!(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0)){
        throw new ApiError(400, "Avatar file is required!!!");
    }
    const avatarLocalFilePath = req.files.avatar[0].path;

    let coverImageLocalFilePath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalFilePath = req.files.coverImage[0].path;
    }

    if([username, email, fullname ,password].some(field => field?.trim() === "" || field === undefined || field === null)){
        deleteLocalImage(avatarLocalFilePath, coverImageLocalFilePath);
        throw new ApiError(400, "Feels like some fields are missing!!!");
    }

    let user = await User.findOne({
        $or:[{ username }, { email }]
    });

    if(user){
        deleteLocalImage(avatarLocalFilePath, coverImageLocalFilePath);
        throw new ApiError(409, "This email or username already exists!!!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath, CLOUD_AVATAR_FOLDER_NAME);
    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath, CLOUD_COVERPIC_FOLDER_NAME);

    if(!avatar){
        throw new ApiError(400, "Avatar file is required!!!");
    }

    user = await User.create({
        fullname,
        email,
        password,
        username,
        avatar:avatar.url,
        coverImage:coverImage?.url || undefined
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering user!!!");
    }

    res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );
});

export const loginUser = asyncHandler(async(req, res) => {
    const {username, email, password} = req.body;

    if(!(username || email)){
        throw new ApiError(400, "username or email required");
    }

    const user = await User.findOne({
        $or:[{username}, {email}]
    });

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isCorrectPassword(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid users credentials");
    }

    const {accessToken, refreshToken} = await getAccessAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly:true,
        secure:true
    }

    res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(
        200,
        {
            user:loggedInUser,
            refreshToken,
            accessToken
        },
        "User logged in successfully"
    ));
});

export const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{refreshToken : 1}
        },
        {new:true}
    );

    const options = {
        httpOnly:true,
        secure:true
    }

    res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
});

export const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh token is required to update tokens");
    }

    const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);
    if(!user){
        throw new ApiError(404, "User not found");
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh token is invalid or expired");
    }

    const {refreshToken : newRefreshToken, accessToken} = await getAccessAndRefreshToken(user._id);
    const options = {
        httpOnly:true,
        secure:true
    }

    res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(new ApiResponse(
        200,
        {accessToken, refreshToken : newRefreshToken},
        "Tokens refreshed successfully"
    ));
});

export const changePassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body;

    if(!oldPassword || !newPassword){
        throw new ApiError(400, "old and new password is required");
    };

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isCorrectPassword(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Incorrect old password");
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json(new ApiResponse(200, {}, "Passoword changed successfully"));
});

export const getUserDetails = asyncHandler(async(req, res)=>{
    res.status(200).json(new ApiResponse(200, req.user, "User get success"));
});

export const updateUserDetails = asyncHandler(async(req, res) => {
    const {fullname, email} = req.body;
    let toUpdate = {};

    if(fullname){
        toUpdate["fullname"] = fullname;
    }

    if(email){
        const user = await User.findOne({email});
        if(user){
            throw new ApiError(400, "This email is already taken");
        }
        toUpdate["email"] = email;
    }

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set:{...toUpdate}
    }, {new:true}).select("-password -refreshToken");

    res.status(200).json(new ApiResponse(200, user, "User details updated successfully"))
});

export const updateAvatar = asyncHandler(async(req, res) => {
    const avatarLocalFilePath = req.file?.path;
    if(!avatarLocalFilePath){
        throw new ApiError(400, "Avatar image is required to update avatar");
    }

    const user = await User.findById(req.user._id).select("-password -refreshToken");
    const delSuccess = await deleteFromCloudinary(user.avatar);
    if(!delSuccess){
        throw new ApiError(500, "Something went wrong while updating avatar");
    }

    const avatar = await uploadOnCloudinary(avatarLocalFilePath, CLOUD_AVATAR_FOLDER_NAME);
    user.avatar = avatar.url;
    await user.save();

    res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export const updateCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalFilePath = req.file?.path;
    if(!coverImageLocalFilePath){
        throw new ApiError(400, "Cover image is required to update cover image");
    }

    const user = await User.findById(req.user._id).select("-password -refreshToken");

    if(user.coverImage){
        const delSuccess = await deleteFromCloudinary(user.coverImage);
        if(!delSuccess){
            throw new ApiError(500, "Something went wrong while updating cover image");
        }
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalFilePath, CLOUD_COVERPIC_FOLDER_NAME);
    user.coverImage = coverImage.url;
    await user.save();

    res.status(200).json(new ApiResponse(200, user, "Cover image update successfully"));
});

export const getChannelDetails = asyncHandler(async(req, res) => {
    const {username} = req.params;
    if(!username?.trim()){
        throw new ApiError(400, "username is required");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLocaleLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    if(channel?.length === 0){
        throw new ApiError(404, "Channel do not exist")
    }

    res.status(200).json(new ApiResponse(200, channel[0], "Channel fetched successfully"));
});

export const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        username : 1,
                                        avatar : 1,
                                        fullname : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        //this is for getting the first element from the owner array because pipelines returns array
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);

    console.log(user);

    res.status(200).json(new ApiResponse(
        200,
        user[0].watchHistory,
        "Get watch history success"
    ))
});