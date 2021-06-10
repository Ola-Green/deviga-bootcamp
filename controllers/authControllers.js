const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fetch = require("node-fetch");
const {google} = require("googleapis");
const dotenv = require("dotenv");
const User = require("../models/userModel");

const sendMail = require("./sendMail");

dotenv.config();

const {
    ACTIVATION_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_SECRET,
    CLIENT_URL,
    GOOGLE_SECRET,
    MAILING_SERVICE_CLIENT_ID,
    FACEBOOK_SECRET,
} = process.env;

const {OAuth2} = google.auth;
const client = new OAuth2(MAILING_SERVICE_CLIENT_ID);

const authControllers = {
    register: async (req, res) => {

        try {
            const {fullName, mobile, category, gender, email, password, username} = req.body;

            const lowercaseName = username.toLowerCase().replace(/ /g, "");

            const user_name = await User.findOne({lowercaseName: username});

            if (user_name) return res.status(400).json({msg: "username is taken"});

            if (!validateEmail(email)) return res.status(400).json({msg: "Email is invalid"});

            const user = await User.findOne({email});

            if (user) return res.status(400).json({msg: "Email already exists"});

            if (password.length < 6) return res.status(400).json({msg: "Password must be at least 6 chars long"});

            const passwordHash = await bcrypt.hash(password, 12);

            const newUser = {
                fullName, email, username: lowercaseName, password: passwordHash,
                gender, mobile, category
            }

            const activation_token = createActivationToken(newUser);

            const url = `${CLIENT_URL}/api/activate/${activation_token}`;

            sendMail(email, url, "Please verify Your Email Address");

            res.json({msg: "Registration succeeded.Activation link has been sent to your email."});

        } catch (err) {
            return res.status(500).json({msg: err.message});
        }

    },

    activateEmail: async (req, res) => {
        try {
            const {activation_token} = req.body;

            const user = jwt.verify(activation_token, ACTIVATION_TOKEN_SECRET);

            const {fullName, mobile, category, gender, email, password, username} = user;

            const check = await User.findOne({email});

            if (check) return res.status(400).json({msg: "This email is taken"});

            const newUser = new User({fullName, mobile, category, gender, email, password, username});

            await newUser.save();

            res.json({msg: "Account has been activated.You may now log in"});


        } catch (err) {
            return res.status(400).json({msg: err.message});
        }
    },

    login: async (req, res) => {
        try {
            const {email, password} = req.body;

            const user = await User.findOne({email})
                .populate("followers following", "avatar username fullName followers following")

            if (!user) return res.status(400).json({msg: "This email does not exist"});

            const isMatch = bcrypt.compare(password, user.password);

            if (!isMatch) return res.status(400).json({msg: "Password is incorrect"});

            const access_token = createAccessToken({id: user._id});

            const refresh_token = createRefreshToken({id: user._id});

            res.cookie("refreshtoken", refresh_token, {
                httpOnly: true,
                path: "/api/refresh_token",
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                msg: "Login Success",
                access_token,
                user: {...user._doc, password: ""}
            });

        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    },

    getAccessToken: (req, res) => {
        try {
            const rf_token = req.cookies.refreshtoken;

            if (!rf_token) return res.status(400).json({msg: "Please Login"});

            jwt.verify(rf_token, REFRESH_TOKEN_SECRET, async (err, result) => {
                if (err) return res.status(400).json({msg: "Please Login Now"});

                const user = await User.findById(result.id).select("-password")
                    .populate('followers following', 'avatar username fullName followers following')
                ;

                if (!user) return res.status(400).json({msg: "This user does not exist"});

                const access_token = createAccessToken({id: result.id});

                res.json({access_token, user});
            });
        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    },
    resetPassword: async (req, res) => {
        try {
            const {password} = req.body;

            const passwordHash = await bcrypt.hash(password, 12);

            await User.findOneAndUpdate({_id: req.user._id}, {
                password: passwordHash
            });

            res.json({msg: "Password successfully changed"});

        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    },
    forgotPassword:async(req,res) => {
        try{
            const {email} = req.body
            const user = await User.findOne({email})
            if(!user) return res.status(400).json({msg: "This email does not exist."})

            const access_token = createAccessToken({id: user._id})
            const url = `${CLIENT_URL}/api/reset/${access_token}`

            sendMail(email, url, "Please reset your password")
            res.json({msg: "Please check your email."});

        }catch(err){
            return res.status(500).json({msg:err.message});
        }
    },

    logout: async (req, res) => {
        try {
            res.clearCookie("refreshtoken", {path: "/api/refresh_token"});

            res.json({msg: "Logged out"});
        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    },

    googleLogin: async (req, res) => {
        try {
            const {tokenId} = req.body;
            const verify = client.verifyIdToken({
                idToken: tokenId,
                audience: MAILING_SERVICE_CLIENT_ID
            });

            const {email_verified, username, email, picture} = verified.payload;

            const password = email + GOOGLE_SECRET;

            const passwordHash = await bcrypt.hash(password, 12);

            if (!email_verified) return res.status(400).json({msg: "Email verification failed"});

            const user = await User.findOne({email});

            if (user) {
                const isMatch = await bcrypt.compare(password, user.password);

                if (!isMatch) return res.status(400).json({msg: "Password is incorrect"});

                const refresh_token = createRefreshToken({id: user._id});

                res.cookie("refreshtoken", refresh_token, {
                    httpOnly: true,
                    path: "/api/refresh_token",
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                });

                res.json({msg: "Login Success"});
            } else {
                const newUser = new User({
                    username, email, avatar: picture, password: passwordHash
                });

                await newUser.save();

                const refresh_token = createRefreshToken({id: newUser._id});

                res.cookie("refreshtoken", refresh_token, {
                    httpOnly: true,
                    path: "/api/refresh_token",
                    maxAge: 7 * 24 * 60 * 60 * 1000
                });

                res.json({msg: "Login success"});
            }
        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    },

    facebookLogin: async (req, res) => {
        try {
            const {accessToken, userID} = req.body;

            const URL = `https://graph.facebook.com/v2.9/${userID}/?fields=id,name,email,picture&access_token=${accessToken}`;

            const data = fetch(URL).then(res => res.json()).then(res => res);

            const {username, email, picture} = data;

            const password = email + FACEBOOK_SECRET;

            const passwordHash = await bcrypt.hash(password, 12);

            const user = await User.findOne({email});

            if (user) {
                const isMatch = await bcrypt.comapre(password, user.password);

                if (!isMatch) return res.status(400).json({msg: "Password is incorrect"});

                const refresh_token = createRefreshToken({id: user._id});

                res.cookie("refreshtoken", refresh_token, {
                    httpOnly: true,
                    path: "/api/refresh_token",
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                });

                res.json({msg: "Login Success"});
            } else {
                const newUser = new User({
                    username,
                    password: passwordHash,
                    email,
                    avatar: picture.data.url
                });

                await newUser.save();

                const refresh_token = createRefreshToken({id: newUser._id});

                res.cookie("refreshtoken", refresh_token, {
                    httpOnly: true,
                    path: "/api/refresh_token",
                    maxAge: 7 * 24 * 60 * 60
                });

                res.json({msg: "Login success"});
            }

        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    }
}

const createActivationToken = payload => jwt.sign(payload, ACTIVATION_TOKEN_SECRET, {expiresIn: "10m"});

const createAccessToken = payload => jwt.sign(payload, ACCESS_TOKEN_SECRET, {expiresIn: "1d"});

const createRefreshToken = payload => jwt.sign(payload, REFRESH_TOKEN_SECRET, {expiresIn: "7d"});


module.exports = authControllers;


function validateEmail(email) {
    const regExp = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regExp.test(email);
}