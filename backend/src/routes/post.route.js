import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/authentication.middleware.js";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPostbyId,
  updatePost,
} from "../controllers/post.controller.js";

const router = Router();

router.route("/createPost").post(verifyJwt, upload.single("image"), createPost);
router.route("/deletePost/:id").delete(verifyJwt, deletePost);
router.route("/updatePost/:id").patch(verifyJwt, updatePost);
router.route("/getPost/:id").get(verifyJwt, getPostbyId);
router.route("/getAllPosts").get(getAllPosts);

export default router;
