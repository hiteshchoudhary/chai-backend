import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import { CLOUD_THUMBNAIL_FOLDER_NAME, CLOUD_VIDEO_FOLDER_NAME } from "../constants.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    page = isNaN(page) ? 1 : Number(page);
    limit = isNaN(limit) ? 10 : Number(limit);
    if(page <= 0){
        page = 1;
    }
    if(limit <= 0){
        page = 10;
    }

    const matchStage = {};
    if(userId && isValidObjectId(userId)){
        matchStage["$match"] = {
            owner:new mongoose.Types.ObjectId(userId)
        }
    }
    else if(query) {
        matchStage["$match"] = {
            $or:[
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ]
        }
    }
    else {
        matchStage["$match"] = {}
    }

    if(userId && query){
        matchStage["$match"] = {
            $and:[
                {owner: new mongoose.Types.ObjectId(userId)},
                {
                    $or:[
                        { title: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }
    }

    const joinOwnerStage = {
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
    }

    const addFieldStage = {
        $addFields : {
            owner : {
                $first : "$owner"
            }
        }
    }
        
    const sortStage = {};
    if(sortBy && sortType){
        sortStage["$sort"] = {
            [sortBy]: sortType === "asc" ? 1 : -1
        }
    }else{
        sortStage["$sort"] = {
            createdAt: -1
        }
    }

    const skipStage = { $skip: (page - 1) * limit };
    const limitStage = { $limit: limit };

    const videos = await Video.aggregate([
        matchStage,
        joinOwnerStage,
        addFieldStage,
        sortStage,
        skipStage,
        limitStage
    ]);

    res.status(200).json(new ApiResponse(
        200,
        videos,
        "Get videos success"
    ));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400, "Title or description is required!!!");
    }
    if(!(req.files && Array.isArray(req.files.videoFile) && req.files.videoFile.length > 0)){
        throw new ApiError(400, "Video file is required!!!");
    }
    const videoFileLocalPath = req.files.videoFile[0].path;

    if(!(req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0)){
        throw new ApiError(400, "Thumbnail of a video is required!!!");
    }
    const thumbnailLocalPath = req.files.thumbnail[0].path;

    const uploadedVideo = await uploadOnCloudinary(videoFileLocalPath, CLOUD_VIDEO_FOLDER_NAME);
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath, CLOUD_THUMBNAIL_FOLDER_NAME);

    if(!uploadedVideo || !uploadedThumbnail){
        throw new ApiError(500, "Something went wrong while uploading video");
    }

    const videoObj = {
        videoFile: uploadedVideo.url,
        thumbnail: uploadedThumbnail.url,
        title: title.trim(),
        description: description.trim(),
        duration: Math.round(uploadedVideo.duration),
        owner: req.user._id
    }

    const video = await Video.create(videoObj);
    if(!video){
        await deleteFromCloudinary(uploadedVideo.url);
        await deleteFromCloudinary(uploadedThumbnail.url);
        throw new ApiError(500, "Something went wrong!!!");
    }
    res.status(201).json(new ApiResponse(
        201,
        video,
        "Upload video success"
    ));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is required or invalid!!");
    }

    let video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likes: {
                    $size: "$likes"
                },
                views: {
                    $add: [1, "$views"]
                }
            }
        }
    ]);

    if(video.length > 0){
        video = video[0];
    }

    await Video.findByIdAndUpdate(videoId, {
        $set:{
            views: video.views
        }
    });

    res.status(200).json(new ApiResponse(
        200,
        video,
        "Get single video success"
    ));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId?.trim() || !isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is required or invalid!!");
    }
    let video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found to update");
    }

    const {title, description} = req.body;
    const fieldsToUpdate = {};

    if(title?.trim()){
        fieldsToUpdate["title"] = title.trim();
    }
    if(description?.trim()){
        fieldsToUpdate["description"] = description.trim();
    }

    const thumbnailLocalPath = req.file?.path;
    if(thumbnailLocalPath){
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, CLOUD_THUMBNAIL_FOLDER_NAME);
        if(!thumbnail){
            throw new ApiError(500, "Something went wrong while updating thumbnail!!");
        }
        await deleteFromCloudinary(video.thumbnail);
        fieldsToUpdate["thumbnail"] = thumbnail.url;
    }

    video = await Video.findByIdAndUpdate(videoId, {
        $set: {...fieldsToUpdate}
    }, {new:true});

    res.status(200).json(new ApiResponse(
        200, 
        video,
        "Video details update success"
    ));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId?.trim() || !isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is required or invalid");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found for deletion");
    }

    if(video.owner?._id?.toString() !== req.user?._id?.toString()){
        throw new ApiError(401, "You cannot delete this video");
    }

    const {_id, videoFile, thumbnail} = video;
    const delResponse = await Video.findByIdAndDelete(_id);
    if(delResponse){
        await Promise.all([
            Like.deleteMany({video: _id}),
            Comment.deleteMany({video: _id}),
            deleteFromCloudinary(videoFile, "video"),
            deleteFromCloudinary(thumbnail),
        ]);
    }else{
        throw new ApiError(500, "Something went wrong while deleting video");
    }

    res.status(200).json(new ApiResponse(
        200,
        {},
        "Video deletion success"
    ));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if(!videoId?.trim() || !isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is required or invalid");
    }

    let video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404, "Video not found for state updation");
    }

    video.isPublished = !(video.isPublished);
    await video.save();

    res.status(200).json(new ApiResponse(
        200,
        video,
        "Video status update success"
    ));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}