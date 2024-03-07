import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const obj ={};
   const vediodetails  = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"vedios",
                localField:"_id",
                foreignField:"owner", 
                as:"totalvedios"
            }
        },
   
        {
            $addFields:{
                totalvedios:"$totalvedios"
            }
        },
        {
            $unwind:"$totalvedios"
        },
        {
            $group:{
                _id:"$_id",
                totalvedios:{
                    $sum:1
                } ,
                totalviews:{
                    $sum:"$totalvedios.views"
                },   
              
                      
          }
        },
        {
            $lookup:{
                from:"users",
                localField:"_id",
                foreignField:"_id",
                as:"totalsubscribers" 
            }  
        },
        {
            $addFields:{
                totalsubscribers:{
                    $first:"$totalsubscribers"
                },
               
            },
           
        },
        {
            $project:{
                totalvedios:1,
                totalviews:1,
                totalsubscribers:{
                    $size:"$totalsubscribers.subscriber" 
                },
               
            

            }
        }])
        if(!vediodetails){
        obj["vediosdetails"] = 0

        }

        const likesdetailsofvedios = await Vedio.aggregate([
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"vedio",
                    as:"totalvediolikes"
                }
            },
            {
                $unwind:"$totalvediolikes"
            },
            {
                $group:{
                    _id:"$totalvediolikes._id" ,
                    
             }
            },
            {
             $count:"totallike"
            }

        ])
        if(!likesdetailsofvedios){
            obj["vediosdetails"] = 0
    
            }

        const likesdetailsofcomments = await Comment.aggregate([
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"comment",
                    as:"totalcommentlikes"
                }
            },
            {
                $unwind:"$totalcommentlikes"
            },
            {
                $group:{
                    _id:"$totalcommentlikes._id" ,
                    
             }
            },
            {
             $count:"totallike"
            }

        ])
        if(!likesdetailsofcomments){
            obj["vediosdetails"] = 0
    
            }

        const likesdetailsoftweets = await Tweet.aggregate([
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"tweet",
                    as:"totaltweetlikes"
                }
            },
            {
                $unwind:"$totaltweetlikes"
            },
            {
                $group:{
                    _id:"$totaltweetlikes._id" ,
                    
             }
            },
            {
             $count:"totallike"
            }

        ])
        if(!likesdetailsoftweets){
            obj["vediosdetails"] = 0
    
            }

        obj["vediosdetails"] = vediodetails ,
        obj["vedioslkes"] = likesdetailsofvedios
        obj["commentlkes"] = likesdetailsofcomments
        obj["tweetlikes"] = likesdetailsoftweets


 
   
        
     




    return res.json(
        new apiResponse(
            200,
            obj
            
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
   const vedios = await Vedio.find(
        {
            owner:req.user?._id
        }
    )

    if(!(vedios || vedios.length >0)){
        return res.status(200).json(
            new apiResponse(
                200,
                "not published yet"
            )
        )
    }

    return res.status(200).json(
        new apiResponse(
            200,
            vedios,
            "published vedios are yet"
        )
    )





})

export {
    getChannelStats, 
    getChannelVideos
    }
