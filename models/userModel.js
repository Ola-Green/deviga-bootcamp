const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please Enter Your Full Name"],
      tim: true,
      maxLength: 25,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxLength: 25,
    },

    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      trim: true,
      maxLength: 25,
    },

    password: {
      type: String,
      required: [true, "Please Enter Your Password"],
    },

    role: {
      type: Number,
      default: 0,
    },

    gender: {
      type: String,
      default: "male",
    },

    story: {
      type: String,
      default: "",
      maxLength: 200,
    },
    mobile: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },
    website: { type: String, default: "" },

    category: {
      type: String,
      required: [true, "Please choose a category"],
    },
    followers: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    saved: [{ type: mongoose.Types.ObjectId, ref: "User" }],

    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/deviga-hub/image/upload/v1615513712/default_user2_obdbty.jpg",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", schema);
