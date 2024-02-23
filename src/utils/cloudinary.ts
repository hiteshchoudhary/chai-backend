import { UploadApiResponse, v2 as cloudinary } from "cloudinary";

import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const uploadOnCloudinary = async (
  localFilePath: string
): Promise<UploadApiResponse | null> => {
  try {
    if (!localFilePath) {
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilePath);
    // console.log("file is uploaded on cloudinary", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove the locally saved temporary file as upload operation got failed
    console.log("Cloudinary Error: " + error);
    return null;
  }
};

const extractPublicIdFromUrl = async (imageUrl: string): Promise<string> => {
  const parts = imageUrl.split("/");
  const publicIdWithFormat = parts[parts.length - 1];
  const publicId = publicIdWithFormat.split(".")[0];
  // console.log("publicId", publicId);
  return publicId;
};

const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  try {
    if (!publicId) {
      throw new Error("required Public Id");
    }

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    console.log(response);

    return response;
  } catch (error) {
    console.log("Failed to delete url from cloudinary", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary, extractPublicIdFromUrl };
