import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

const generateAccessRefreshToken = async (userid) => {
  try {
    const user = await User.findById(userid);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.RefreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName } = req.body;
  if (
    [username, email, password, fullName].some((field) => field?.trim() == "")
  ) {
    throw new ApiError(401, "All fields are needed");
  }

  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existUser) {
    throw new ApiError(401, "User Already exists");
  }

  const profileLocalPath = req.file?.path;
  if (!profileLocalPath) {
    throw new ApiError(401, "File path couldnt be found");
  }

  const uploadProfile = await uploadCloudinary(profileLocalPath);
  if (!uploadProfile) {
    throw new ApiError(500, "Profile couldnt be uplaoded to cloudinary");
  }

  const user = await User.create({
    username,
    avatar: { url: uploadProfile?.url, publicId: uploadProfile?.publicId },
    email,
    fullName: fullName,
    password,
  });

  if (!user) {
    throw new ApiError(500, "User couldnt be created");
  }

  const createdUser = await User.findById(user._id).select(
    "-password -RefreshToken"
  );

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username && !email)
    throw new ApiError(401, "Either one of the fields is required");
  if (!password) throw new ApiError(401, "Password");

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  const passwordCorrect = user.passwordCheck(password);
  if (!passwordCorrect) throw new ApiError(401, "Unauthorized Access");

  if (!user) throw new ApiError(404, "User not found");

  const { accessToken, refreshToken } = await generateAccessRefreshToken(
    user._id
  );

  const loggedUser = await User.findById(user._id).select(
    "-password -RefreshToken"
  );
  const options = {
    httpOnly: true,
    secure: false,
  };
  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedUser, accessToken, refreshToken },
        "Successfully logged In"
      )
    );
});

const loggedOut = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        RefreshToken: 1,
      },
    },
    {
      $new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: false,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Logged Out"));
});

const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const check = await user.passwordCheck(oldPassword);
  if (!check) throw new ApiError(401, "Old password incorrect");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -RefreshToken"
  );

  if (!user) throw new ApiError(404, "No such user found");

  return res
    .status(201)
    .json(new ApiResponse(200, user, "Fetched user detials successfully"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { email, fullName } = req.body;

  if (!email && !fullName)
    throw new ApiError(401, "One field is required atleast");

  // const createdUserEmail = await User.findOne({ email: email });

  const existingUser = await User.findOne({
    email: email,
    _id: { $ne: req.user?._id },
  });

  if (existingUser) {
    throw new ApiError(401, "user already exists with the existing email");
  }

  const fieldsAvailable = {};
  if (email) fieldsAvailable.email = email;
  if (fullName) fieldsAvailable.fullName = fullName;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: fieldsAvailable,
    },
    { new: true }
  );

  if (!user) throw new ApiError(500, "Fields couldnt be uploaded");

  return res
    .status(201)
    .json(new ApiResponse(200, user, "Successfully updated"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const newAvatarPath = req.file?.path;

  if (!newAvatarPath) throw new ApiError(401, "File Path couldnt be found");

  const user = await User.findById(req.user._id);

  if (req.user._id.toString() !== user._id.toString()) {
    throw new ApiError(401, "unauthorized update request");
  }

  if (user.avatar?.public_id) {
    try {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    } catch (error) {
      throw new ApiError(400, "Error deleting old image");
    }
  }

  const uploadAvatar = await uploadCloudinary(newAvatarPath);
  if (!uploadAvatar) throw new ApiError(500, "Avatar couldnt be uploaded");

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: uploadAvatar.url },
    },
    { new: true }
  );

  return res
    .status(201)
    .json(new ApiResponse(200, user, "Successfully updated profile picture"));
});

const getPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(404, "No username entered");

  const posts = await User.aggregate([
    {
      $match: { username: username.trim() },
    },
    {
      $lookup: {
        from: "posts",
        localField: "_id",
        foreignField: "postedBy",
        as: "posts",
      },
    },
    {
      $addFields: {
        postCount: {
          $size: "$posts",
        },
      },
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        posts: 1,
        postCount: 1,
      },
    },
  ]);
});

export {
  registerUser,
  loginUser,
  loggedOut,
  getPosts,
  getProfile,
  updateAvatar,
  updatePassword,
  updateProfile,
};
