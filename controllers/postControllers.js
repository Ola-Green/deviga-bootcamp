const Post = require("../models/postModel");

class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  paginating() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 9;

    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

const postControllers = {
  createPost: async (req, res) => {
    try {
      const { content, images } = req.body;

      const newPost = new Post({ content, images, user: req.user._id });

      await newPost.save();

      res.json({
        msg: "Created Post!",
        newPost: {
          ...newPost._doc,
          user: req.user,
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getPosts: async (req, res) => {
    try {
      const features = new ApiFeatures(Post.find(), req.query).paginating();
      const posts = await features.query
        .sort("-createdAt")
        .populate("user likes", "username fullName avatar followers")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        });
      res.json({
        msg: "Success",
        result: posts.length,
        posts,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id)
        .populate("user likes", "avatar username fullName")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password",
          },
        });
      if (!post)
        return res.status(400).json({ msg: "This post does not exist" });

      res.json({ post });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getPostDiscover: async (req, res) => {
    try {
      const features = new ApiFeatures(
        Post.find({ user: { $ne: req.user._id } }),
        req.query
      ).paginating();
      const posts = await features.query.sort("-createdAt");

      res.json({
        message: "success",
        result: posts.length,
        posts,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  updatePost: async (req, res) => {
    try {
      const { content, images } = req.body;
      const post = await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          content,
          images,
        }
      ).populate("user likes", "username fullName avatar");

      res.json({
        msg: "Update success",
        newPost: {
          ...post._doc,
          content,
          images,
        },
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  likePost: async (req, res) => {
    try {
      const post = await Post.find({ _id: req.params.id, likes: req.user._id });

      if (post.length > 0)
        return res.status(400).json({ msg: "You already liked post." });

      const like = await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { likes: req.user._id },
        },
        { new: true }
      );
      if (!like)
        return res.status(400).json({ msg: "This post does not exist" });

      res.json({ msg: "Post Liked" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unlikePost: async (req, res) => {
    try {
      const like = await Post.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { likes: req.user._id },
        },
        { new: true }
      );

      if (!like)
        return res.status(400).json({ msg: "This post does not exist" });

      res.json({ msg: "You unliked post" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getUserPosts: async (req, res) => {
    try {
      const features = new ApiFeatures(
        Post.find({ user: req.params.id }),
        req.query
      ).paginating();
      const posts = await features.query.sort("-createdAt");

      res.json({
        posts,
        result: posts.length,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deletePost: async (req, res) => {
    try {
      const post = await Post.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

      await Comment.deleteMany({ _id: { $in: post.comments } });

      res.json({ msg: "Post Deleted" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  savePost: async (req, res) => {
    try {
      const user = await User.find({ _id: req.user._id, saved: req.params.id });
      if (user.length > 0)
        return res.status(400).json({ msg: "You saved this post" });

      const save = await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { saved: req.params.id },
        },
        { new: true }
      );

      if (!save)
        return res.status(400).json({ msg: "This user does not exist" });

      res.json({ msg: "Saved Post" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  unSavePost: async (req, res) => {
    try {
      const save = await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { saved: req.params.id },
        },
        { new: true }
      );

      if (!save)
        return res.status(400).json({ msg: "This user does not exist" });

      res.json({ msg: "Post unsaved" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getSavedPost: async (req, res) => {
    try {
      const features = new ApiFeatures(
        Post.find({ _id: { $in: req.user.saved } }),
        req.query
      ).paginating();

      const savedPosts = await features.query.sort("-createdAt");

      res.json({ savedPosts, result: savedPosts.length });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = postControllers;
