const express = require("express");
const {
  registerUser,
  loginUser,
  followUser,
  logoutUser,
  updatePassword,
  updateProfile,
  deleteAccount,
  myProfile,
  getAllUsers,
  getUserProfile,
  forgotPassword,
  resetPassword,
} = require("../controllers/user");
const { isAuntenticated } = require("../middleware/auth");

const router = express.Router();

// Create a new post || POST
router.route("/register").post(registerUser);

// Login user || POST
router.route("/login").post(loginUser);

// logout user || POST
router.route("/logout").get(logoutUser);

// Follow user || POST
router.route("/follow/:id").get(isAuntenticated, followUser);

// update password || PUT
router.route("/update/password").put(isAuntenticated, updatePassword);

// update profile || PUT
router.route("/update/profile").put(isAuntenticated, updateProfile);

// delete account || DELETE
router.route("/delete/me").delete(isAuntenticated, deleteAccount);

// get my profile || GET
router.route("/me").get(isAuntenticated,myProfile);

// get user profile || GET
router.route("/user/:id").get(isAuntenticated,getUserProfile);

// get all users || GET
router.route("/users").get(isAuntenticated,getAllUsers);

// forgot password
router.route("/forgot/password").post(forgotPassword);

// reset password
router.route("/password/reset/:token").put(resetPassword)

module.exports = router;
