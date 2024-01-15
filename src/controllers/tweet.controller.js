import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body;

    if (!content || content.trim()==="" ) {
        throw new ApiError(400, `content is required `);
    }

    const tweet = await Tweet.create({
        content:content.trim(),
        owner:new mongoose.Types.ObjectId(req.user._id)
    })

    if (!tweet) {
        throw new ApiError(500, "Something went wrong while create the video document")
    }

    const createdTweet = await Tweet.findById(tweet._id);

    if (!createdTweet) {
        throw new ApiError(500, "Something went wrong while create the video document")
    }

    return res.status(201).json(
        new ApiResponse(200, createdTweet, "video uploaded Successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params;

    if (!userId ) {
        throw new ApiError(400, `userId is required `);
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400,"user dose not exist")
    }

    const tweets = await Tweet.aggregate([
        {
            $match:{owner: new mongoose.Types.ObjectId(userId)}
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
                            fullName:1,
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
    ])


    return res.status(201).json(
        new ApiResponse(200, tweets, "get all tweets Successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const {content} = req.body;

    if (!content || content.trim()==="" ) {
        throw new ApiError(400, `content is required `);
    }

    if (!tweetId) {
        throw new ApiError(400, `tweetId is required `);
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:content
            }
        },
        {new:true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200,tweet,"Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    if (!tweetId) {
        throw new ApiError(400, `tweetId is required `);
    }

    const result = await Tweet.findByIdAndDelete(tweetId);

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
