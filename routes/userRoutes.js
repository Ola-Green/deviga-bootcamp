const express = require("express");
const auth = require("../middlewares/auth");
const adminAuth = require("../middlewares/adminAuth");
const userControllers = require("../controllers/userControllers");

const router = express.Router();


router.get('/search', auth, userControllers.searchUser);
router.get("/user/:id", auth, userControllers.getUser);
router.get("/getusers", auth,adminAuth, userControllers.getUsers);
router.get("/others", auth, userControllers.getOtherUsers);
router.patch("/updateuser", auth, userControllers.updateUser);
router.patch("/update_role/:id", auth, adminAuth, userControllers.updateUserRole);
router.patch("/user/:id/follow", auth, userControllers.follow);
router.patch("/user/:id/unfollow", auth, userControllers.unfollow);
router.get("/suggestion_user", auth, userControllers.suggestionsUser);

router.delete("/delete/:id", auth, adminAuth, userControllers.deleteUser);

module.exports = router;
