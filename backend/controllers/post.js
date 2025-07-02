const Post = require("../models/Post");
const User = require("../models/User");

// create a new post || POST
exports.createPost = async (req, res) => {
  try {
    const newPostData = {
      caption: req.body.caption,
      image: {
        public_id: req.body.public_id,
        url: req.body.url,
      },
      owner: req.user._id,
    };
    const newPost = await Post.create(newPostData);

    const user = await User.findById(req.user._id);
    user.posts.push(newPost._id);

    await user.save();

    res.status(201).json({
      success: true,
      post: newPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// delete a post || DELETE
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to delete this post",
      });
    }
    await Post.findByIdAndDelete(req.params.id);

    const user = await User.findById(req.user._id);

    const index = user.posts.indexOf(req.params.id);

    user.posts.splice(index, 1);
    await user.save();
    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// like and unlike
exports.likeAndUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const user = await User.findById(req.user._id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.likes.includes(user._id)) {
      const index = post.likes.indexOf(user._id);
      post.likes.splice(index, 1);
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Post Unliked",
      });
    } else {
      post.likes.push(user._id);
      await post.save();
      return res.status(200).json({
        success: true,
        message: "Post Liked",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all posts of following || GET
exports.getPostsOfFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const posts = await Post.find({
      owner: {
        $in: user.following,
      },
    }).populate("owner likes");

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// update caption of post || PUT
exports.updateCaption = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    if (post.owner.toString() !== req.user._id.toString()) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to update this post",
      });
    }
    post.caption = req.body.caption;
    await post.save();
    res.status(200).json({
      success: true,
      message: "Caption updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// comment create and update
exports.commentOnPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(400).send({
        success: false,
        message: "Post not found",
      });
    }
    let commentIndex = -1;

    // Checking if comment already exists
    for (let i = 0; i < post.comments.length; i++) {
      if (post.comments[i].user.toString() === req.user._id.toString()) {
        commentIndex = i;
        break;
      }
    }

    if (commentIndex !== -1) {
      post.comments[commentIndex].comment = req.body.comment;
      await post.save();
      return res.status(200).send({
        success: true,
        message: "Post updated",
      });
    } else {
      post.comments.push({
        user: req.user._id,
        comment: req.body.comment,
      });
      await post.save();
      return res.status(200).send({
        success: true,
        message: "Comment Added",
      });
    }
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// comment delete
exports.deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      res.status(400).send({
        success: false,
        message: "Post not found",
      });
    }

    // checking if owner wants to delete
    if (post.owner.toString === req.user._id.toString()) {
      if (req.body.commentId === undefined) {
        return res.status(400).send({
          success: false,
          message: "Comment id is required",
        });
      }

      for (let i = 0; i < post.comments.length; i++) {
        if (post.comments[i]._id.toString() === req.body.commentId.toString()) {
          return post.comments.splice(i, 1);
        }
      }
      await post.save();
      return res.status(200).send({
        success: true,
        message: "Selected comment has deleted",
      });
    } else {
      for (let i = 0; i < post.comments.length; i++) {
        if (post.comments[i].user.toString() === req.user._id.toString()) {
          return post.comments.splice(i, 1);
        }
      }
    }
    await post.save();
    return res.status(200).send({
      success: true,
      message: "Your comment has deleted successfully",
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};
