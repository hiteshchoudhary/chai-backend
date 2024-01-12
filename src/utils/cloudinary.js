import {v2 as cloudinary} from "cloudinary";
import {extractPublicId} from "cloudinary-build-url";
import fs from "fs";

cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async(filePath, cloudinaryFolder) => {
    try {
        if(!filePath) return null;
        const response = await cloudinary.uploader.upload(filePath, {
            folder:cloudinaryFolder,
            resource_type:"auto"
        });
        fs.unlinkSync(filePath);
        return response;
    } catch (error) {
        fs.unlinkSync(filePath); //remove the saved file from the server as the upload operation got failed
        return null;
    }
}

const deleteFromCloudinary = async(url, resourceType = "image") => {
    const publicId = extractPublicId(url);
    try {
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return response;
    } catch (error) {
        console.log("Error while deleting from cloudinary");
        console.log(error);
        return null;
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}