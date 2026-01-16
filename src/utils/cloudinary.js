import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

//make cloudinary credentials safer by using environment variables
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        console.log(`[${process.env.CLOUDINARY_API_KEY?.trim()}]`);
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.log("cloudinary service error",error);
         // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}
const deleteImageFromCloudinary=async(publicId)=>{
    try {
        const deleteImage=await cloudinary.uploader.destroy(publicId,{resource_type:"image"});
        return deleteImage;
    } catch (error) {
        console.log("cloudinary deleteion error: ",error);
    }
}
const deleteVideoFromCloudinary=async(publicId)=>{
    try {
        const deleteVideo=await cloudinary.uploader.destroy(publicId,{resource_type:"video"});
        return deleteVideo;
    } catch (error) {
        console.log("cloudinary deleteion error: ",error);
    }
}



export {uploadOnCloudinary,deleteVideoFromCloudinary,deleteImageFromCloudinary}