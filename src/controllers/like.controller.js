import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
<<<<<<< HEAD
    try{
        const {videoId} = req.params
        if(!isValidObjectId(videoId)){
            throw new ApiError(400, "Invalid video id");
        }

        const existingLike = await Like.findOne({likedBy: req.user.id, video: videoId});
        if(existingLike){
            await Like.deleteOne({_id: existingLike._id});
            return res.status(200).json(new ApiResponse(200, "Video like removed"));
        } else{
            const newLike = new Like({
                likedBy: req.user.id,
                video: videoId
            });

            await newLike.save();

            return res.status(201).json(new ApiResponse(201, "Video liked"));
        }
    } catch(error){
        throw new ApiError(500, error.message);
=======
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video id");
    }

    const existingLike = await Like.findOne({likedBy: req.user.id, video: videoId});
    if(existingLike){
        await Like.deleteOne({_id: existingLike._id});
        return res.status(200).json(new ApiResponse(200, "Video like removed"));
    } else{
        const newLike = new Like({
            likedBy: req.user.id,
            video: videoId
        });

        await newLike.save();

        return res.status(201).json(new ApiResponse(201, "Video liked"));
>>>>>>> e01ec568180c834198cff2b67aa9b0bb283c07c8
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
<<<<<<< HEAD
    try{
        const {commentId} = req.params
        if(!isValidObjectId(commentId)){
            throw new ApiError(400, "Invalid comment id");
        }

        const existingCommentLike = await Like.findOne({likedBy: req.user.id, comment: commentId});
        if(existingCommentLike){
            await Like.deleteOne({_id: existingCommentLike._id});
            return res.status(200).json(new ApiResponse(200, "Comment like removed"));
        } else{
            const newCommentLike = new Like({
                likedBy: req.user.id,
                comment: commentId
            });

            await newCommentLike.save();

            return res.status(201).json(new ApiResponse(201, "Comment liked"));
        }
    } catch(error){
        throw new ApiError(500, error.message);
=======
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid comment id");
    }

    const existingCommentLike = await Like.findOne({likedBy: req.user.id, comment: commentId});
    if(existingCommentLike){
        await Like.deleteOne({_id: existingCommentLike._id});
        return res.status(200).json(new ApiResponse(200, "Comment like removed"));
    } else{
        const newCommentLike = new Like({
            likedBy: req.user.id,
            comment: commentId
        });

        await newCommentLike.save();

        return res.status(201).json(new ApiResponse(201, "Comment liked"));
>>>>>>> e01ec568180c834198cff2b67aa9b0bb283c07c8
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
<<<<<<< HEAD
    try{
        const {tweetId} = req.params
        if(!isValidObjectId(tweetId)){
            throw new ApiError(400, "Invalid tweet id");
        }

        const existingTweetLike = await Like.findOne({likedBy: req.user.id, tweet: tweetId});
        if(existingTweetLike){
            await Like.deleteOne({_id: existingTweetLike._id}); 
            return res.status(200).json(new ApiResponse(200, "Tweet like removed"));
        } else{
            const newTweetLike = new Like({
                likedBy: req.user.id,
                tweet: tweetId
            });

            await newTweetLike.save();

            return res.status(201).json(new ApiResponse(201, "Tweet liked"));
        }
    } catch(error){
        throw new ApiError(500, error.message);
=======
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweet id");
    }

    const existingTweetLike = await Like.findOne({likedBy: req.user.id, tweet: tweetId});
    if(existingTweetLike){
        await Like.deleteOne({_id: existingTweetLike._id}); 
        return res.status(200).json(new ApiResponse(200, "Tweet like removed"));
    } else{
        const newTweetLike = new Like({
            likedBy: req.user.id,
            tweet: tweetId
        });

        await newTweetLike.save();

        return res.status(201).json(new ApiResponse(201, "Tweet liked"));
>>>>>>> e01ec568180c834198cff2b67aa9b0bb283c07c8
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
<<<<<<< HEAD
    try{
        const userId = req.user.id;
        const likedVideos = await Like.find({likedBy: userId}).populate("video");

        if(likedVideos === 0){
            return res.status(200).json(new ApiResponse(200, "No liked videos found"));
        }

        const likeCounts = await Like.aggregate([{
            $group: {
                _id: "$video",
                totalLikes: {$sum: 1}
            }
        }]);

        const response = likedVideos.map(video => {
            const likeCount = likeCounts.find(count => count._id.toString() === video.video._id.toString());
            return {
                videoId: video.video._id,
                title: video.video.title,
                description: video.video.description,
                totalLikes: likeCount ? likeCount.totalLikes : 0
            };
        });

        return res.status(200).json(new ApiResponse(200, "Liked videos fetched successfully", {
            likedVideos: response,
            totalCount: likedVideos.length
        }));
    } catch(error){
        throw new ApiError(500, error.message);
    }
=======
    const userId = req.user.id;
    const likedVideos = await Like.find({likedBy: userId}).populate("video");

    if(likedVideos === 0){
        return res.status(200).json(new ApiResponse(200, "No liked videos found"));
    }

    const likeCounts = await Like.aggregate([{
        $group: {
            _id: "$video",
            totalLikes: {$sum: 1}
        }
    }]);

    const response = likedVideos.map(video => {
        const likeCount = likeCounts.find(count => count._id.toString() === video.video._id.toString());
        return {
            videoId: video.video._id,
            title: video.video.title,
            description: video.video.description,
            totalLikes: likeCount ? likeCount.totalLikes : 0
        };
    });

    return res.status(200).json(new ApiResponse(200, "Liked videos fetched successfully", {
        likedVideos: response,
        totalCount: likedVideos.length
    }));
>>>>>>> e01ec568180c834198cff2b67aa9b0bb283c07c8
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
