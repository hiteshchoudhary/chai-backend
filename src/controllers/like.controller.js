import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user?._id;
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({video:videoId, likedBy:userId});

    if(existingLike){
        await Like.findOneAndRemove({video:videoId, likedBy:userId});
        return res      
            .status(200)
            .json(
                new ApiResponse(200,{},"Video unliked")
            )
    }

    const newLike = await Like.create({
        video: videoId,
        likedBy: userId
    })
    return res      
            .status(200)
            .json(
                new ApiResponse(200,newLike,"Video liked")
            )

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
     const userId = req.user?._id;
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({comment:commentId, likedBy:userId});

    if(existingLike){
        await Like.findOneAndRemove({comment:commentId, likedBy:userId});
        return res      
            .status(200)
            .json(
                new ApiResponse(200,{},"Comment unliked")
            )
    }

    const newLike = await Like.create({
        comment: commentId,
        likedBy: userId
    })
    return res
            .status(200)
            .json(
                new ApiResponse(200,newLike,"Comment liked")
            )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user?._id;
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid Tweet ID");
    }

    const existingLike = await Like.findOne({tweet:tweetId, likedBy:userId});

    if(existingLike){
        await Like.findOneAndRemove({tweet:tweetId, likedBy:userId});
        return res      
            .status(200)
            .json(
                new ApiResponse(200,{},"Tweet unliked")
            )
    }

    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: userId
    })
    return res
            .status(200)
            .json(
                new ApiResponse(200,newLike,"Tweet liked")
            )

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id;

    const videos = await Like.aggregate([
        {
            $match: {
                video: {
                    $exists: true
                },
                likedBy: userId
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username:1,
                                        fullname: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                $first: "$video"
            }
        }
    ])

    if (!videos.length) {
        throw new ApiError(404, "No Liked videos");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200,videos,"Liked Videos fetched successfully")
        )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}