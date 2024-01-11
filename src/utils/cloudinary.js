import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "chai-backend",
    });
    // file has been uploaded successful
    //console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async (resourceUrl, inFolder) => {
  const urlArray = resourceUrl.split("/");

  const resourcePublicId = inFolder
    ? `${urlArray[urlArray.length - 2]}/${
        urlArray[urlArray.length - 1].split(".")[0]
      }`
    : `${urlArray[urlArray.length - 1].split(".")[0]}`;

  const res = await cloudinary.uploader.destroy(resourcePublicId);

  return res.result?.toString().toLowerCase() === "ok";
};

export { uploadOnCloudinary, deleteFromCloudinary };
