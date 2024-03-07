import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist

    console.log(name,description);
    if(!(name || description)){
        throw new apiError(400,"for creation name and descripton is req.")
    }

  const playlistCreation =  await Playlist.create({
        name:name,
        description: description || "",
        owner:req.user?._id,
        videos:[]
    })

    return res.status(200).json(
        new apiResponse(
            200,
            playlistCreation,
            "playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

  

    if(!userId){
        throw new apiError(400,"userid cannot found")
    }

    const userExisted =  await User.findById(userId)
    if(!userExisted){
        throw new apiError(400,"user whose playlist we are searching doesnot exist")
    }

   const userAllPlaylists = await Playlist.aggregate([
    {
        $match:{
            owner: new mongoose.Types.ObjectId(userId),
        }
    },
    {
        $project:{
            name:1,
            description:1,
            owner:1,
            videos:{
                $cond:{
                    if:["$owner",new mongoose.Types.ObjectId(req.user?._id)],
                    then:"$vedios",
                    else:{
                        $filter: {
                            input: '$videos',
                            as: 'vedioofarray',
                            cond: { $gt: ['$vedioofarray.isPublished',true] }
                          }
                    }
                }
            },
            createdAt:1,
            updatedAt:1
        }
    }
   ])
   if(!userAllPlaylists){
    throw new apiError(400,"user doesnot have playlist")
   }

   return res.status(200).json(
    new apiResponse(
        200,
        userAllPlaylists,
        "user all playlists"
    )
   )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    

    if(!playlistId){
        throw new apiError(400,"for deletion u must provide playlist id is necesary")
    }

    const playlistGetById=  await Playlist.findById(playlistId)
    if(!playlistGetById){
        throw new apiError(400,"Playlist cannot get by id")
    }

    return res.status(200).json(
        new apiResponse(
            200,
            playlistGetById,
            "playlist found"
        )
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

   

    if(!playlistId){
        throw new apiError(400,"Cannot get playlist id")
    }

    if(!videoId){
        throw new apiError(400,"Cannot get video id")
    }

  const playlist =  await Playlist.findById(playlistId)
  if(!playlist){
    throw new apiError(400,"Cannot find the playlist")
  }

  const vedioFound = await Vedio.findById(videoId)
//   console.log(vedioFound.owner.toString());
//   console.log(req.user?._id);

  
  if(!vedioFound || !(vedioFound.owner.toString() === req.user?._id.toString()))
  {
    throw new apiError(400,"Vedio not found while searching through vedioid")
  }

 const vedioAlreadyHave =  await playlist.videos.includes(videoId)
 
 if(vedioAlreadyHave){
    return res.status(200).json(
        new apiResponse(
            200,
            "already have that vedio"
        )
    )
 }
 console.log(vedioFound);
 const vedio =  playlist.videos.push(vedioFound)
 playlist.save()
//  console.log(playlist.videos);
 return res.status(200).json(
    new apiResponse(
        200,
        `vedio added total vedio:${vedio}`
    )
)
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
   


    if(!(playlistId && videoId)){
        throw  new apiError(400,"playlistid an dvedio id is required")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new apiError(400,"playlist is not found")
    }

    if(!(playlist.owner.toString() === req.user?._id.toString())){
        throw new apiError(400,"user has to login by his id of for removing vedio from playlist")
    }

    const vedio = await Vedio.findById(videoId)
    if(!vedio || !(vedio.owner.toString() == req.user?._id.toString())){
        throw new apiError(400,"vedio is not found")
    }

   const videoExist =  await playlist.videos.includes(videoId)
   if(!videoExist){
    throw new apiError(400,"video does not exist in playliist")
   }

   const pulled = playlist.videos.remove(vedio)
   playlist.save()
   return res.status(200).json(
    new apiResponse(
        200,
        pulled,
        "vedio removed from playlist"    )
   )




})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

 

    if(!playlistId){
        throw new apiError(400,"for deletion u must provide playlist id is necesary")
    }

    

  const deleteChecker =   await Playlist.findByIdAndDelete({
        _id:playlistId,
    })

    if(!deleteChecker){
        throw new apiError(400,"unable to delete playlist")
    }
    if(!(deleteChecker.owner.toString() === req.user?._id.toString())){
        throw new apiError(400,"user has to login by his id of for deletion")
    }

    res.status(200).json(
        new apiResponse(
            200,
            "Deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist


    if(!playlistId){
        throw new apiError(400,"for updation u must provide playlist id is necesary")
        
    }
    
    if(!(name && description)){
        throw new apiError(400,"for updation name and description is necesary")
    }

   const platlistFound =   await Playlist.findById(playlistId)
   if(!platlistFound){
    throw new apiError(400,"playlist need for updation deoesnt exist")
   }

   if(!(platlistFound.owner.toString() === req.user?._id.toString())){
    throw new apiError(400,"user has to login by his id of for updation")
}

   if(platlistFound.name == name || platlistFound.description == description){
    throw new apiError(400,"Proide some unique name and description these are alreday there")
   }

   const updatePlaylist  = await Playlist.findByIdAndUpdate(
    {_id:playlistId},
    {
        $set:{
            name:name,
            description:description,
        }
    },
    {new:true}
   )

   res.status(200).json(
        new apiResponse(
        200,
        updatePlaylist,
        "name and description updated"
    )
   )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
