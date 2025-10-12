import { vs as cloudinary } from "cloudinary";
import { log } from "console";
import fs from "fs";
import { User } from "../models/user.model.js";
import { ApiError } from "./api_error";

cloudinary.config({
  cloud_name: process.env.cloudinary_cloud_name,
  api_key: process.env.cloudinary_api_key,
  api_secret: process.env.cloudinary_api_secret,
});

const uploadCloudinary = async (localfilepath) => {
  try {
    if (!localfilepath) return null;

    const response = await cloudinary.uploader.upload(localfilepath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localfilepath);
    return response;
  } catch (error) {
    fs.unlinkSync(localfilepath);
    return null;
  }
};

const deleteCloudinary = async (userid) => {
  try {
    const user = await User.findById(userid);
    if (!user)
      throw new ApiError(
        401,
        "user couldnt be found while deleting file from cloudinary"
      );
    const url = user.avatar;

    function extractPublicId() {
      const parts = url.split("/upload/");
      if (parts.length < 2) return null;

      const pathAfterUpload = parts[1];
      const segments = pathAfterUpload.split("/");

      const filenameWithExt = segments.slice(1).join("/");

      const publicId = filenameWithExt.replace(/\.[^/.]+$/, "");

      return publicId;
    }
    const publicId = extractPublicId(url);

    const response = await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new ApiError(500, "Couldnt delete cloudinary avatar");
  }
};

export { uploadCloudinary, deleteCloudinary };
