
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/** 
 * Deletes a file from Cloudinary
 * @param {string} filePublic_id - The public ID of the file to delete
 * @param {"image" | "video" | "raw"} resourceType - The type of file (image" or "video", "raw( pdf, zips )")
 */

const deleteFromCloudinary = async(filePublic_id,resourceType) => {
    try {
        if(!filePublic_id) return null;
       const response = await cloudinary.uploader.destroy(
        filePublic_id,
        {resource_type:resourceType}
       )
       return response
    }
    catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        return null;
    }
}

export default deleteFromCloudinary
