import Router from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getPosts,
  getProfile,
  loggedOut,
  loginUser,
  registerUser,
  updateAvatar,
  updatePassword,
  updateProfile,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.route("/register").post(upload.single("avatar"), registerUser);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt, loggedOut);
router.route("/updateProfile").patch(verifyJwt, updateProfile);
router.route("/updatePassword").patch(verifyJwt, updatePassword);
router.route("/updateAvatar").patch(verifyJwt, updateAvatar);
router.route("/getPosts").get(verifyJwt, getPosts);
router.route("/getProfile").get(verifyJwt, getProfile);

export default router;
