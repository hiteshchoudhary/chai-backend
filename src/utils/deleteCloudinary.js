import { v2 as cloudinary } from 'cloudinary';
import fs from "fs" // file system 
import { ApiError } from './ApiError.js';



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET_KEY // Click 'View API Keys' above to copy your API secret
});


const deletefromCloudinary = async (public_id) => {
    console.log(public_id);

    try {
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type: "image", // or "video"/"raw" depending on the type
        });
        return response;
    }

    catch (error) {
        throw new ApiError(409, "Image Deletion has some errors")

    }
}



export { deletefromCloudinary };