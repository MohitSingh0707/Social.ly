const express = require("express");
const {
  createPost,
  likeAndUnlikePost,
  deletePost,
  getPostsOfFollowing,
  updateCaption,
  commentOnPost,
  deleteComment,
} = require("../controllers/post");
const { isAuntenticated } = require("../middleware/auth");

const router = express.Router();

// Create a new post || POST
router.route("/post/upload").post(isAuntenticated, createPost);

// Delete a post || DELETE
router.route("/post/:id").delete(isAuntenticated, deletePost);

// like and unlike post || get
router.route("/post/:id").get(isAuntenticated, likeAndUnlikePost);

// get all post of following || GET
router.route("/posts").get(isAuntenticated, getPostsOfFollowing);

// update caption || PUT
router.route("/post/:id").put(isAuntenticated, updateCaption);

// add and update  Comment
router.route("/post/comment/:id").put(isAuntenticated,commentOnPost);

// comment delete 
router.route("/post/comment/:id").delete(isAuntenticated,deleteComment);

module.exports = router;
