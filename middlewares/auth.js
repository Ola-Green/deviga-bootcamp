const jwt = require("jsonwebtoken");

const dotenv = require("dotenv");

const User = require("../models/userModel");

dotenv.config();


const {ACCESS_TOKEN_SECRET} = process.env;

const auth = async(req, res, next) => {
    try {
        const token = req.header("Authorization");
        if (!token) return res.status(400).json({ msg: "Invalid Authentication" });
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
        if (!decoded)
            return res.status(400).json({ msg: "Invalid Authentication" });

        const user = await User.findOne({ _id: decoded.id });

        req.user = user;
        next();
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
}

module.exports = auth;