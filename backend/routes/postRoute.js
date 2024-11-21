import express from "express";
import { createPost } from "../controllers/postController.js";

const postRouter = express.Router();

postRouter.post("/create", createPost,isAuthenticated);

export default postRouter;