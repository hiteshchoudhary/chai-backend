import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

   


const subscribeToaChannel = asyncHandler(async(req,res)=>{
   


     const {channelId} = req.params;

     const registeredUser = await User.findById(channelId)
     if(!registeredUser){
         throw new apiError(400,"channel which u are trying to acces for ubscribe doesnot exist")
      }

    const userExisted =  await Subscription.find(
        {
            subscriber:req.user?._id,
            channel:channelId,
        }
        )
        // console.log(userExisted)

        if(userExisted.length >0){
        // throw new apiError(400,"you have already subscribed to a channel");
         throw new apiError(200,"you have already subscribed")

        }

        const subscriberr = await User.findById(req.user?._id)
        const channel = await User.findById(channelId)


       const subcribed =  await Subscription.create({
            subscriber:subscriberr,
            channel:channel,
        })

        if(!subcribed){
        throw new apiError(400,"there is a error when u are trying to subscribe to a channel");

        }
        

        await User.findByIdAndUpdate(
            channelId,
            {
            //   
            $push:{
                subscriber:subscriberr
            }},
            {new:true}
        )

        await User.findByIdAndUpdate(
            req.user?._id,
            {
                $push:{
                    subscribeTo:channel
                }
            },
            {new:true}
        )


        return res.status(200).json(
            new apiResponse(
                200,
                subcribed,
                "succesfully subscribed channel"
            ) 
         )
})

const unsubscribeaChannel = asyncHandler(async(req,res)=>{
    const {channelId} = req.params

    const registeredUser = await User.findById(channelId)
    if(!registeredUser){
        throw new apiError(400,"channel which u are trying to acces for unsubscribe doesnot exist")
     }

     console.log(registeredUser?._id);
     
     const unsubscribe = await Subscription.findOneAndDelete({
        channel: registeredUser._id,
        subscriber: req.user?._id,
      });

      console.log(unsubscribe);

    if(!unsubscribe)
    {
       throw new apiError(400,"unsubscribe failed")
    }

    
    await User.findByIdAndUpdate(
        channelId,
        {
        //   
        $pull:{
            subscriber:channelId
        }},
        {new:true}
    )

    await User.findByIdAndUpdate(
        req.user?._id,
        {
            
                $pull:{
                subscribeTo:registeredUser._id
            },
        },
        {new:true}
    )
 

    
    return res.status(200).json(
       new apiResponse(
           200,
           unsubscribe,
           "succesfully unsubscribed channel"
       )
    )
    


})

const getuserchannelsubscriber = asyncHandler(async(req,res)=>{
    const {subscriberId} = req.params
    const registeredUser = await User.findById(subscriberId)
    if(!registeredUser || !(registeredUser._id.toString() == req.user._id.toString())){
        throw new apiError(400,"subscriber id doesnot exists")
     }


    const user = await Subscription.aggregate([
        {
            $match:{
                channel:registeredUser?._id
            },
        },
        {
            $project:{
                channel:1,




            }
        }
    ])

    return res.status(200).json(
        new apiResponse(
            200,
            user,
            "list pf subscriber found "
        )
     )

})

const getsubscribedchannels = asyncHandler(async(req,res)=>{
    const {channelId} = req.params

    const registeredUser = await User.findById(channelId)
    if(!registeredUser || !(registeredUser._id.toString() == req.user._id.toString())){
        throw new apiError(400,"channel which u are trying to acces for getting list doesnot exist")
     }

     const user = await Subscription.aggregate([
        {
            $match:{
                subscriber:registeredUser?._id
            }
        },
        {
            $project:{
                subscriber:1
            }
        }
    ])

    return res.status(200).json(
        new apiResponse(
            200,
            user,
            "list pf channe i subscribed found "
        )
     )
     
})

export {

    subscribeToaChannel,
    unsubscribeaChannel,
    getuserchannelsubscriber,
    getsubscribedchannels,

}
