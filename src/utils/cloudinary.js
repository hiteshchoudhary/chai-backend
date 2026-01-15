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
        return null;
    }
}

/**
 * deleteFromCloudinary - Delete a file from Cloudinary using its URL
 * 
 * Features:
 * - Extracts public_id from Cloudinary URL
 * - Deletes the file from Cloudinary
 * - Handles errors gracefully
 * 
 * Process:
 * 1. Extract public_id from Cloudinary URL
 * 2. Delete file from Cloudinary using public_id
 * 3. Return deletion result
 * 
 * @param {string} cloudinaryUrl - The Cloudinary URL of the file to delete
 * @returns {Promise<Object|null>} - Deletion result or null if failed
 */
const deleteFromCloudinary = async (cloudinaryUrl) => {
    try {
        if (!cloudinaryUrl) return null

        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{version}/{public_id}.{format}
        // We need to extract the public_id part
        const urlParts = cloudinaryUrl.split('/')
        const uploadIndex = urlParts.findIndex(part => part === 'upload')
        
        if (uploadIndex === -1) {
            console.log("Invalid Cloudinary URL format")
            return null
        }

        // Get the part after 'upload' which contains version and public_id
        const afterUpload = urlParts.slice(uploadIndex + 1).join('/')
        // Remove file extension to get public_id
        const publicId = afterUpload.split('.')[0]

        if (!publicId) {
            console.log("Could not extract public_id from URL")
            return null
        }

        // Delete the file from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image" // Assuming images, can be made dynamic if needed
        })

        return result

    } catch (error) {
        console.error("Error deleting from Cloudinary:", error)
        return null
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}