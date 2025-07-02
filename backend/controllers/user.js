const { options } = require("../app");
const user = require("../models/User");
const Post = require("../models/Post");
const {sendEmail}=require("../middleware/sendEmail")
const crypto =require("crypto");

// register user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }
    let existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }
    const newUser = await user.create({
      name,
      email,
      password,
      avatar: {
        public_id: "sample id",
        url: "sample url",
      },
    });
    const token = await newUser.generateToken();

    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(201).cookie("token", token, options).json({
      success: true,
      token,
      user: existingUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// login user
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter all fields",
      });
    }
    const existingUser = await user.findOne({ email }).select("+password");
    if (!existingUser) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const isPasswordMatched = await existingUser.matchPassword(password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }
    const token = await existingUser.generateToken();

    const options = {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };
    res.status(201).cookie("token", token, options).json({
      success: true,
      token,
      user: existingUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// logout user
exports.logoutUser = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
      })
      .json({
        success: true,
        message: "Logged out successfully",
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// folow or unfollow a user
exports.followUser = async (req, res) => {
  try {
    const userToFollow = await user.findById(req.params.id);
    const loggedInUser = await user.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    if (loggedInUser.following.includes(userToFollow._id)) {
      const indexFollowing = loggedInUser.following.indexOf(userToFollow._id);
      loggedInUser.following.splice(indexFollowing, 1);

      const indexFollower = userToFollow.followers.indexOf(loggedInUser._id);
      userToFollow.followers.splice(indexFollower, 1);

      await loggedInUser.save();
      await userToFollow.save();
      res.status(200).json({
        success: true,
        message: "User Unfollowed",
      });
    } else {
      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);
      await loggedInUser.save();
      await userToFollow.save();

      res.status(200).json({
        success: true,
        message: "User Followed",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update password
exports.updatePassword = async (req, res) => {
  try {
    const User = await user.findById(req.user._id).select("+password");
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.json({
        success: false,
        message: "Please enter all fields",
      });
    }
    if (oldPassword === newPassword) {
      return res.json({
        success: false,
        message: "New password should be different from old password",
      });
    }
    const isPasswordMatched = await User.matchPassword(oldPassword);
    if (!isPasswordMatched) {
      return res.json({
        success: false,
        message: "Old password is incorrect",
      });
    }
    User.password = newPassword;
    await User.save();
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const User = await user.findById(req.user._id);

    if (name) {
      User.name = name;
    }
    if (email) {
      User.email = email;
    }

    // user Avatar

    // if(req.body.avatar !== ""){
    //   user.avatar.public_id= "sample id";
    //   user.avatar.url= "sample url";
    // }
    await User.save();
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete account
exports.deleteAccount = async (req, res) => {
  try {
    const User = await user.findById(req.user._id);
    const posts = User.posts;
    const followers = User.followers;
    const following = User.following;

    await User.remove();

    // logout user after deleting account
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    // Delete all posts of the user
    for (let i = 0; i < posts.length; i++) {
      const post = await Post.findById(posts[i]);
      await post.remove();
    }

    // removing user from followers following
    for (let i = 0; i < followers.length; i++) {
      const follower = await user.findById(followers[i]);
      const index = follower.following.indexOf(User._id);
      follower.following.splice(index, 1);
      await follower.save();
    }
    // removing user from following followers
    for (let i = 0; i < following.length; i++) {
      const follow = await user.findById(following[i]);
      const index = follow.followers.indexOf(User._id);
      follow.followers.splice(index, 1);
      await follow.save();
    }

    res.status(200).json({
      success: true,
      message: "Account deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// profile info
exports.myProfile = async (req, res) => {
  try {
    const User = await user.findById(req.user._id).populate("posts");
    res.status(200).json({
      success: true,
      user: User,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const User = await user.findById(req.params.id).populate("posts");
    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      success: true,
      user: User,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await user.find({});
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// forgot password
exports.forgotPassword = async (req, res) => {
  try {
    // Correctly find the user
    const User = await user.findOne({email:req.body.email});
    if (!User) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Generate reset password token
    const resetPasswordToken = User.getResetPasswordToken();  // Correct this line
    await User.save();  // Make sure you save the updated user with token

    // Construct the reset URL
    const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`;

    // Email message
    const message = `Reset your password by clicking on the link below: \n\n ${resetUrl}`;

    // Send the email
    try {
      await sendEmail({
        email: User.email,  // Use 'User.email' here (consistent capitalization)
        subject: "Reset Password",
        message,
      });
      return res.status(201).send({
        success: true,
        message: `Email sent to ${User.email}`,
      });
    } catch (error) {
      // In case of failure, reset token properties and save
      User.resetPasswordToken = undefined;
      User.resetPasswordExpire = undefined;
      await User.save();

      return res.status(500).send({
        success: false,
        message: error.message,
      });
    }
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// reset password
exports.resetPassword = async(req,res)=>{
  try {
    const resetPasswordToken=crypto.createHash("sha256").update(req.params.token).digest("hex");
    const User=await user.findOne({
      resetPasswordToken,
      resetPasswordExpire : {$gt : Date.now()}
    })
    if(!User){
      return res.status(401).json({
        success:false,
        message:"Token is invalid or has expired",
      })
    }
    user.password=req.body.password;

    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;

    await user.save();

    res.status(200).json({
      success:true,
      message:"Password updated"
    })

  } catch (error) {
    res.status(500).send({
      success:false,
      message:error.message,
    })
  }
}
