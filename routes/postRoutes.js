const router = require("express").Router();
const postControllers = require("../controllers/postControllers");
const auth = require("../middlewares/auth");
const adminAuth = require("../middlewares/adminAuth");

router.post("/create", auth, adminAuth, postControllers.createPost);

router.get("/posts", auth, postControllers.getPosts);

router
  .route("/post/:id")
  .patch(auth, adminAuth, postControllers.updatePost)
  .get(auth, postControllers.getPost)
  .delete(auth, adminAuth, postControllers.deletePost);

router.route("/post/:id/like").patch(auth, postControllers.likePost);
router.route("/post/:id/unlike").patch(auth, postControllers.unlikePost);
router.get("/user_posts/:id", auth, postControllers.getUserPosts);
router.get("/post_discover", auth, postControllers.getPostDiscover);
router.patch("/save_post/:id", auth, postControllers.savePost);
router.patch("/unsave_post/:id", auth, postControllers.unSavePost);
router.get("/get_save_post", auth, postControllers.getSavedPost);

module.exports = router;
