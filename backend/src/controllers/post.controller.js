import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/posts.model.js";
import mongoose from "mongoose";
import { error } from "console";

const createPost = asyncHandler(async (req, res) => {
  const { title, description, rating } = req.body;

  if ([title, description, rating].some((fields) => fields?.trim() == "")) {
    throw new ApiError(401, "All fields are required");
  }

  const postImage = req.file?.path;
  let uploadImage;
  if (postImage) {
    uploadImage = await uploadCloudinary(postImage);
    if (!uploadImage) {
      throw new ApiError(500, "Image couldnt be uploaded");
    }
  }

  const post = await Post.create({
    title,
    description,
    postedBy: req.user?._id,
    image: uploadImage?.url,
    rating,
  });

  if (!post) {
    throw new ApiError(500, "Post couldnt be uploaded");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, post, "Successfully posted"));
});

const updatePost = asyncHandler(async (req, res) => {
  const { description } = req.body;
  const { id } = req.params;

  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(500, "Post couldnt be found");
  }

  if (post.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Unauthorized access");
  }

  if (!description) {
    throw new ApiError(401, "No description was provided");
  }

  post.description = description;
  await post.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(200, post, "Successfully updated"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(500, "Post couldnt be found");
  }

  if (post.postedBy.toString() !== req.user._id.toString()) {
    throw new ApiError(401, "Unauthorized access");
  }
  await Post.findByIdAndDelete(id);

  return res.status(201).json(new ApiResponse(200, {}, "Successfully deleted"));
});

const getPostbyId = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, post, "Post fetched successfully"));
});

const getAllPosts = asyncHandler(async (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 10;
  let skip = (page - 1) * limit;

  const posts = await Post.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "postedBy",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        title: 1,
        description: 1,
        createdAt: 1,
        image:1,
        rating:1,
        "user.username": 1,
        "user.avatar": 1,
        "user.fullName":1
      },
      },
    {
      $sort: { createdAt: -1 },
    },
    
    { $skip: skip },
    { $limit: limit },
  ]);
  return res
    .status(200)
    .json(new ApiResponse(200, { posts, page }, "Posts fetched successfully"));
});

export { createPost, deletePost, updatePost, getPostbyId, getAllPosts };
