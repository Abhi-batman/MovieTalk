import jwt from "jsonwebtoken";
import { async_handler } from "./utils/async_handler";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { User } from "../models/user.model";

const veriftyJwt = async_handler(async (req, resp, next) => {
  try {
    const accessToken =
      req.cookies.accessToken ||
      req.header("Authorization").replace("Bearer ", "");
    if (!accessToken) {
      throw ApiError(401, "Unauthorized Acess");
    }

    const decodedToken = jwt.verify(accessToken, process.env.ATS);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw ApiError(404, "No such users found");
    }

    req.user = user;
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
