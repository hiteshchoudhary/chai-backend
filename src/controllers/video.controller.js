import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteVideoFromCloudinary, deleteImageFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy="createdAt", sortType, userId } = req.query;
    const skip=(Number(page)-1)*Number(limit);
    //TODO:make sure you make sortBy safer by using only fields which are possible using enum
    let sortingType=sortType=="asc"?1:-1;
    //TODO: get all videos based on query, sort, pagination
    const videos=await Video.aggregate([
        {
            $match:{isPublished:true}
        },
        {
            $sort:{
                [sortBy]:Number(sortingType)
            }
        },
        {
            $skip:skip
        },
        {
            $limit:Number(limit)
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'owner',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{$first:"$owner"}
            }
        }
    ]);
    const totalVideos=await Video.countDocuments();
    const pages=Math.ceil(totalVideos/Number(limit));
    res.status(200).json(new ApiResponse(200,{videos,totalVideos,pages,hasNextPage:page<pages,hasPreviousPage:page>1},"videos retrieved successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError(403,"user Credentials are required with video");
    }
    if(req.files.thumbnail[0].size===0 || req.files.videoFile[0].size===0){
        throw new ApiError(403,"thmbnail and video required");
    }
    const cloudinaryVideo=await uploadOnCloudinary(req.files.videoFile[0].path);
    const cloudinaryThumbnail=await uploadOnCloudinary(req.files.thumbnail[0].path);
    if(!cloudinaryThumbnail || !cloudinaryVideo){
        throw new ApiError("501","error uploading on cloud")
    }
    const video=await Video.create({
        title,
        description,
        duration:String(cloudinaryVideo.duration),
        owner:req.user._id,
        videoFile:cloudinaryVideo.url,
        thumbnail:cloudinaryThumbnail.url
    })
    res.status(201).json(new ApiResponse(201,video,"video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const video=await Video.findById(videoId);
    res.status(200).json(new ApiResponse(200,video,"video retrieved successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;
    const localThumbnailPath=req.file.path;
    const pastVideo=await Video.findById(videoId);
    // console.log(videoId);
    const publicId = pastVideo.thumbnail.split("/upload/")[1].split("/").slice(1).join("/").replace(/\.[^/.]+$/, "");

    if(!localThumbnailPath){
        throw new ApiError(402,"Thumbnail file not recieved successfully")
    }
    const cloudinaryThumbnail=await uploadOnCloudinary(localThumbnailPath);
    if(!cloudinaryThumbnail){
        throw new ApiError("501","error uploading on cloud")
    }
    //TODO: update video details like title, description, thumbnail
    const newVideo=await Video.findByIdAndUpdate(videoId,{
        thumbnail:cloudinaryThumbnail.url,
        title,
        description
    },{new:true});
    deleteImageFromCloudinary(publicId)
    res.status(200).json(new ApiResponse(200,newVideo,"video updated successfully"));
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video=await Video.findById(videoId);
    const publicId = video.videoFile.split("/upload/")[1].split("/").slice(1).join("/").replace(/\.[^/.]+$/, "");
    const publicIdThumbnail = video.thumbnail.split("/upload/")[1].split("/").slice(1).join("/").replace(/\.[^/.]+$/, "");
    const deleteThumbnail=await deleteImageFromCloudinary(publicIdThumbnail);
    const deletedVideo=await deleteVideoFromCloudinary(publicId);
    if(!deletedVideo || !deleteThumbnail){
        throw new ApiError("501","error deleting on cloud")
    }
    const deleteVideoFromDB=await Video.findByIdAndDelete(videoId)
    res.status(200).json(new ApiResponse(200,deleteVideoFromDB,"video delted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const videoPublishState=await Video.findByIdAndUpdate(
  videoId,
  [
    {
      $set: {
        isPublished: { $not: "$isPublished" }
      }
    }
  ],
  { new: true }
);
    res.status(200).json(new ApiResponse(200,videoPublishState,`video publish status toggled to ${videoPublishState.isPublished}`));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
