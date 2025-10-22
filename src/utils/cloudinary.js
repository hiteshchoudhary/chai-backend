import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { ApiError } from "./ApiError.js";
import { extractPublicId } from "cloudinary-build-url";

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
        return null;
    }
}

const deleteOnCloudinary = async (image) => {
    try {
        if (!image) {
            throw new ApiError(404, "Image Invalid")
        }
        //delete the file on cloudinary
        const publicId = extractPublicId(image);

        const response = await cloudinary.uploader.destroy(publicId);
        if(response.result != 'ok'){
            throw new ApiError(404, "Old Image Deletion Failed from Cloudinary")
        }

        // file has been deleted successfully
        return 1;

    } catch (error) {
        return null;
    }
}

export { uploadOnCloudinary, deleteOnCloudinary }