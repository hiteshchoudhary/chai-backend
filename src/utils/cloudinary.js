<<<<<<< HEAD
import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

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
=======
// This can be also in service folder 
// but we are storing it in utils folder 
import { v2 as cloudinary } from 'cloudinary';
import fs from "fs" // file system 

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY // Click 'View API Keys' above to copy your API secret
});

// Method to upload files on cloudinary 
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        // upload the file on cloudinary 
        const response = await cloudinary.uploader.upload(localFilePath, {
            // All the cloudinary options 
            // Docs available on cloudinary website 
            resource_type: 'auto'
        })
        ///  console.log("File has been uploaded successfully", response.url)
        // Here we have uploaded the images or files succesfully on the cloudinary 
        // Now we will use fs.unlinkSync() to remove these images from local storage after uploading that's why using fs.unlinkSync()
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        // If there is any error , we should delete this file from local server 
        fs.unlinkSync(localFilePath) // remove the locally saved temprorary file as 
        // the upload operation got failed 
>>>>>>> myrepo/main
        return null;
    }
}



<<<<<<< HEAD
export {uploadOnCloudinary}
=======

export { uploadOnCloudinary }
>>>>>>> myrepo/main
