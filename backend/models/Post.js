const mongoose = require("mongoose");
const { use } = require("../app");

const postSchema = new mongoose.Schema({
  caption: {
    type: String,
    required: true,
  },
  image: {
    public_id: String,
    url: String,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
  ],
  comments: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Post", postSchema);
