import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_CLOUD_KEY,
  api_secret: process.env.CLOUDINARY_CLOUD_SECRET,
});

const uploadOnCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return "File not found on server";
    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });

    // File has been uploaded successfully
    fs.unlinkSync(localfilepath);
    return response;
  } catch (error) {
    console.log(error);
    // fs.unlinkSync(localfilepath);
  }
};
const deleteFile = async (publicid) => {
  try {
    if (!publicid) return "Public id not found";
    const deletresponse = await cloudinary.uploader.destroy(publicid, {
      resource_type: "video",
    });
    return deletresponse;
  } catch (e) {
    return e.message;
  }
};

export { uploadOnCloudinary, deleteFile };
