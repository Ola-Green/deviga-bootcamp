const express = require("express");
const authControllers = require("../controllers/authControllers");

const auth = require("../middlewares/auth");

const router = express.Router();


router.post("/register", authControllers.register);
router.post("/login", authControllers.login);
router.post("/activation", authControllers.activateEmail);
router.post("/forget", authControllers.forgotPassword);
router.post("/reset", auth, authControllers.resetPassword);
router.post("/logout", authControllers.logout);
router.post("/refresh_token", authControllers.getAccessToken);
router.post("/google_login", authControllers.googleLogin);
router.post("/facebook_login", authControllers.facebookLogin);

module.exports = router;
