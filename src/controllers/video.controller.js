import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const pipeline = [];
    const defaultCriteria = {
        isPublished:true
    }

    //if user searches something
    if (query) {
        defaultCriteria.$or = [
            { title: { $regex: query, $options: "i" } },//$regex-> You search "coding"(query) application fetches videos with title: "code with me ", "best coding langauge"-> title don't exactly have to match. And $options: "i" makes the search case insensitive. Fetches video with title: "CODING", "Coding","cOdinG" 
            { description: { $regex: query, $options: "i" } }
        ]
    }

    //if user visits a specific profile:
    if(userId){  
        if(!mongoose.isValidObjectId(userId)){
            throw new ApiError(400,"Invalid User 1")
        }
        defaultCriteria.owner = new mongoose.Types.ObjectId(userId) //to scale down the total videos to only the one's uploaded by that specific user
        defaultCriteria.isPublished = false //to fetch all videos including unpublished ones incase the owner wants to see their draft videos
    }

    //push the completed criteria as the first stage 
    pipeline.push({
        $match: defaultCriteria 
    })
   

    //if user sorts by some type of filter:(most expensive,least expensive,most liked...)
    const sortField = {}
    if(sortBy){
         sortField[sortBy]= sortType === "asc" ? 1 : -1         
    }
    else{
        sortField["createdAt"] = sortType === "asc" ? 1: -1
    }

    pipeline.push({
        $sort: sortField
    })

    pipeline.push(
        {

            $lookup:{
                from:"users",
                localField: "owner",
                foreignField: "_id",
                as:"owner",
                pipeline:[{
                    $project:{
                        avatar:1,
                        username:1
                    }
                }]
            },
      },
      {
        $addFields:{
                owner:{$first:"$owner"}
            }
      }
)

    const options= {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const paginatedVideos = await Video.aggregatePaginate(Video.aggregate(pipeline),options)

    if(!paginatedVideos){
        throw new ApiResponse(500,"Couldn't fetch videos, Please try again.")
    }
    
    return res.status(200).json(new ApiResponse(200,paginatedVideos,"Successfully fetched videos"))
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if(!req.user?._id){
        throw new ApiError(400,"Please login and try again")
    }

    if( [title,description].some((field)=>field.trim()=== "")){
        throw new ApiError(400,"All feilds are required.")
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailFileLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videoFileLocalPath){
        throw new ApiError(400,"Video File is required.")
    }

    if(!thumbnailFileLocalPath){
        throw new ApiError(400,"Thumbnail is required.")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnailFile = await uploadOnCloudinary(thumbnailFileLocalPath)

    if(!videoFile?.url || !thumbnailFile?.url){
        throw new ApiError(500,"Upload to cloudinary failed. Please try again")
    }


    //implemented try catch to preven ghost file issue->(Don't have access to the file(.create() failed) so can't remove it, taking exrta space in our cloud costing us 💸)
        try{
        const uploadVideo= await Video.create({
        videoFile: {
            url:videoFile.url,
            public_id:videoFile.public_id
        },
        thumbnail:{
            url:thumbnailFile.url,
            public_id:thumbnailFile.public_id
        },
        owner: req.user?._id,
        title: title.trim(),
        description: description.trim(),
        duration: videoFile.duration,
        views: 0,
        isPublished:true
    })
    //aint using (!uploadVideo) cause code wouldn't even reach it if the .create() failed, it would go straight to the asynchandler

    return res.status(201).json(new ApiResponse(201,uploadVideo,"Successfully uploaded video"))

    }
    catch(error){
        if(videoFile?.public_id){   //checks if the url is in the cloudinary in the first place,
            await deleteFromCloudinary(videoFile.public_id,"video")
        }
        if (thumbnailFile?.public_id){ 
            await deleteFromCloudinary(thumbnailFile.public_id,"image")
        }
    throw error;
}
    // TODO: get video, upload to cloudinary, create video
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(req.user?._id){
        await Video.findOneAndUpdate(videoId,{$inc:{views: 1}})
    }

    const getVideoWithDetails = await Video.aggregate([{
        $match:{
            _id: new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $lookup:{
            from:"comments",
            localField:"_id",
            foreignField:"video",
            as:"comments",
            pipeline:[
                {
                    $sort:{ createdAt :-1}
                },
                {
                    $limit: 10
                },
                {
                    $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"CommentOwnerDetails",
                    pipeline:[{
                        $project:{
                            username:1,
                            avatar:1
                        }
                    }]  
                }},
                {
                    $addFields:{
                       CommentOwnerDetails:{$first:"$CommentOwnerDetails"}
                    }
                }
            ]
        }
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"likes"
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
                {
                    $project:{
                        avatar:1,
                        username:1
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
                    $addFields:{
                        subscriberCount:{ $size : "$subscribers"},
                        isSubscribed:{ $cond:{
                            if:{$in: [new mongoose.Types.ObjectId(req.user._id),"$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }}
                    }
                },
                {
                        $project: { username: 1, avatar: 1, subscriberCount: 1, isSubscribed: 1 }
                }

            ]
        }
    },
    {
        $addFields:{
            totalLikes:{$size:"$likes"},
            isLiked:{
                $cond:{
                    if:{$in:[new mongoose.Types.ObjectId(req.user?._id),"$likes.likedBy"]},
                    then:true,
                    else:false
            }},
            owner: {$first: "$owner"},
        }
    }
])

if(getVideoWithDetails.length===0){
    throw new ApiError(404,"Video doesn't exists sorry")
}

return res.status(200).json(new ApiResponse(200,getVideoWithDetails[0],"successfully fetched video detials"))
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title,description,thumbnail}= req.body
    const userId = req.user?._id

    if(title.trim()===""|| !title && thumbnail.trim()==="" ||!thumbnail && !description){
        throw new ApiError(400,"Required atleast one field to update")
    }

    const updateData = {}

    if(title){
        updateData.title = title.trim()
    }

    if(description){
        updateData.description = description.trim()
    }

    if(thumbnail){
        updateData.thumbnail = thumbnail.trim()
    }

    const updateVideo = await Video.findOneAndUpdate({
        _id:videoId,
        owner:userId
    },
    {
        $set: updateData
    },
    {
        new:true
    })

    if(!updateVideo){
        throw new ApiError(404, "Video not found or you are not authorized to update this video")

    }
    return res.status(200).json(new ApiResponse(200,updateVideo,"Successfully updated video details"))
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id

    const video = await Video.findOneAndDelete({
        _id:videoId,
        owner:userId
    })

    if(!video){
        throw new ApiError(404, "Video not found or you are not authorized to delete this video")
    }

    return res.status(200).json(new ApiResponse(200,null,"Successfully deleted video"))


    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id

    const toggleStatus = await Video.findOneAndUpdate({
        _id:videoId,
        owner:userId
    },
    [{
        $set:{
            isPublished: { $not: "$isPublished" }
        }
    }],
    {
        new:true
    }
    )

    if(!video){
        throw new ApiError(404, "Video not found or you are not authorized to update this video")
    }

    return res.status(200).json(new ApiResponse(200,toggleStatus,"Successfully toggled publish status"))   

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
