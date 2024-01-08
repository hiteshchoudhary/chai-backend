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
    });
    // file has been uploaded successfull
    console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

const deleteOnCloudinary = async (url) => {
  try {
    //Getting public Id
    const publicId = url.split("/").pop().split(".")[0];
    // console.log("This is public Id", publicId);
    //Validating Public ID
    if (!publicId) {
      return console.log("No public Id present");
    }
    const options = {
      invalidate: true,
    };

    // Delete the file using the public ID
    cloudinary.uploader.destroy(publicId, function (error, result) {
      console.log(result, error);
    });
    return console.log("Deleted successfully");
  } catch (error) {
    console.log(error.message);
    return res
      .status(500)
      .json({ message: "something went wrong", data: error.message });
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
