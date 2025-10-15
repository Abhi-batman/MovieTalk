import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { User } from "../models/user.model.js";

const verifyJwt = asyncHandler(async (req, _, next) => {
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
      throw new ApiError(404, "No such users found");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
export { verifyJwt };
