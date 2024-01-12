import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content } = req.body
    if(!content ){
        throw new ApiError(400,"Invalid/Something messied")
    }
    const tweet =  await Tweet.create({
        content : req.body.content,
        owner : req.user
    } )
    
    if(!tweet) throw new ApiError(500,"can't find tweet database")

    res
    .status(200)
    .json( new ApiResponse(200 , tweet ,"created") )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // ?page=1&limit=10&sortType=new 
    const {userId} =  req.params;
    const { page = 1, limit = 10, sortType } = req.query

    const parsedLimit = parseInt(limit);
    const pageSkip = (page - 1) * parsedLimit;
    const sortBy = sortType === 'new' ? 1 : -1;


    if(!userId ){
        throw new ApiError(400,"Invalid/Something messied")
    }

    const tweets = await Tweet
    .find({owner : ObjectId(userId)})
    .sort({createdAt : sortBy})
    .skip(pageSkip)
    .limit(parsedLimit)


    if(!tweets) throw new ApiError(500,"can't find tweet")

    res
    .status(200)
    .json( new ApiResponse(200 , tweets ,"success") )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {updateTweetContent} = req.body;
    const {tweetId} =  req.params;
    if(!(updateTweetContent || tweetId) ){
        throw new ApiError(400,"Invalid/Something messied")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId, 
        {
            $set:{
                content : updateTweetContent
            }
        }, 
        {new : true}
    )
    if(!tweet) throw new ApiError(500,"can't find tweet")

    res
    .status(200)
    .json( new ApiResponse(200 , tweet ,"updated") )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} =  req.params;
    if(!(tweetId) ){
        throw new ApiError(400,"Invalid/Something messied")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId,)
    if(!tweet) throw new ApiError(500,"can't find tweet")

    res
    .status(200)
    .json( new ApiResponse(200 , tweet ,"updated") )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
