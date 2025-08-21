import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuring Cloudinary with credentials stored in environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // Your API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // If no file path is provided, return null

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Auto-detect file type (image, video, raw file, etc.)
    });

    /*
      File successfully uploaded to Cloudinary!
      - `response.url` contains the URL of the uploaded file
     */

    fs.unlinkSync(localFilePath); // Delete the local file after successful upload
    return response; // Return Cloudinary's response object
  } catch (error) {
    /*
       Upload failed! Possible reasons:
      - Invalid Cloudinary credentials
      - Network issues
      - Unsupported file format
     */

    fs.unlinkSync(localFilePath); // Delete the temp file if upload fails
    return null; // Return null to indicate failure
  }
};

export { uploadOnCloudinary };

/*
👉 How does `cloudinary.uploader.upload()` work?
   - Takes in the `localFilePath`, uploads the file, and returns details like the public URL.
*/
