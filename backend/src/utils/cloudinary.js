import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import {getVideoDurationInSeconds as duration} from 'get-video-duration'

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const videoDuration = async function (videoLocalPath) {
  try {
    const res = duration(videoLocalPath)
  } catch (error) {
    console.log(error);
    
  }
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}


async function deleteCloudinary(url) {
  try {
    if (!url) return null;

    // extract public_id from Cloudinary URL
    const parts = url.split("/");
    const fileWithExt = parts[parts.length - 1]; // e.g. myphoto.jpg
    const publicId = fileWithExt.split(".")[0];  // e.g. myphoto

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    return response;
  } catch (error) {
    console.log(`Error while deleting the old image: ${error}`);
  }
}






export {uploadOnCloudinary, deleteCloudinary, videoDuration}