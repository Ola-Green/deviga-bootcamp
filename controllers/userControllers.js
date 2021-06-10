const dotenv = require("dotenv");

const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

const userControllers = {
  searchUser: async (req, res) => {
    try {
      const users = await User.find({
        username: { $regex: req.query.username },
      })
        .limit(10)
        .select("fullName username avatar");

      res.json({ users });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getUser: async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");
      if (!user) return res.status(400).json({ msg: "User does not exist" });

      res.json({ user });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getUsers: async (req, res) => {
    try {
      const users = await User.find().select("-password");

      res.json(users);
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const {
        fullName,
        avatar,
        mobile,
        story,
        website,
        category,
        address,
        gender,
      } = req.body;
      if (!fullName)
        return res.status(400).json({ msg: "Please Enter Your full name" });

      await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          fullName,
          avatar,
          mobile,
          story,
          website,
          category,
          address,
          gender,
        }
      );

      res.json({ msg: "Update Succeeded" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  updateUserRole: async (req, res) => {
    try {
      const { role } = req.body;

      const user = await User.findOneAndUpdate(
        { _id: req.params.id },
        { role }
      );

      res.json({ msg: "Update Succeeded" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  follow: async (req, res) => {
    try {
      const user = await User.find({
        _id: req.params.id,
        followers: req.user._id,
      });
      if (user.length > 0)
        return res.status(500).json({ msg: "You followed this user." });

      const newUser = await User.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { followers: req.user._id },
        },
        { new: true }
      ).populate("followers following", "-password");

      await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { following: req.params.id },
        },
        { new: true }
      );

      res.json({ newUser });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  unfollow: async (req, res) => {
    try {
      const newUser = await User.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { followers: req.user._id },
        },
        { new: true }
      ).populate("followers following", "-password");

      await User.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { following: req.params.id },
        },
        { new: true }
      );

      res.json({ newUser });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  suggestionsUser: async (req, res) => {
    try {
      const newArr = [...req.user.following, req.user._id];

      const num = req.query.num || 10;

      const users = await User.aggregate([
        { $match: { _id: { $nin: newArr } } },
        { $sample: { size: Number(num) } },
        {
          $lookup: {
            from: "users",
            localField: "followers",
            foreignField: "_id",
            as: "followers",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "following",
            foreignField: "_id",
            as: "following",
          },
        },
      ]).project("-password");

      return res.json({
        users,
        result: users.length,
      });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
  getOtherUsers: async (req, res) => {
    try {
      const users = await User.find({ _id: { $ne: req.user._id } }).select(
        "-password"
      );

      res.json({ users });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      await User.findOneAndDelete(req.params.id);

      res.json({ msg: "User Deleted" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = userControllers;
