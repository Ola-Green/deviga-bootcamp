const Comment = require("../models/commentModel");
const  Post = require("../models/postModel");

const commentController = {
    createComment: async (req, res) => {
        try {
            const { postId, content, tag, reply, postUserId } = req.body;


            const post = await Post.findById(postId);

            if (!post)
                return res.status(400).json({ msg: "This post does not exist." });

            if (reply) {
                const cm = await Comment.findById(reply);
                if (!cm)
                    return res.status(400).json({ msg: "This comment does not exist" });
            }

            const newComment = new Comment({
                user: req.user._id,
                tag,
                content,
                reply,
                postUserId,
                postId,
            });

            await Post.findOneAndUpdate(
                { _id: postId },
                {
                    $push: { comments: newComment._id },
                },
                { new: true }
            );

            await newComment.save();

            res.json({ newComment });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    updateComment: async (req, res) => {
        try {
            const { content } = req.body;

            await Comment.findByIdAndUpdate(
                { _id: req.params.id, user: req.user._id },
                { content }
            );

            res.json({ msg: "Update succeeded" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },

    likeComment: async (req, res) => {
        try {
            const comment = await Comment.find({
                _id: req.params.id,
                likes: req.user._id,
            });
            if (comment.length > 0)
                return res.status(400).json({ msg: "Already liked comment" });

            await Comment.findByIdAndUpdate(
                { _id: req.params.id },
                {
                    $push: { likes: req.user._id },
                },
                { new: true }
            );

            res.json({ msg: "Comment liked" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
    unlikeComment: async (req, res) => {
        try {
            await Comment.findOneAndUpdate(
                { _id: req.params.id },
                {
                    $pull: { likes: req.user._id },
                },
                { new: true }
            );

            res.json({ msg: "Comment unliked" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },


    deleteComment: async (req, res) => {
        try {
            const comment = await Comment.findOneAndDelete({
                _id: req.params.id,
                $or: [{ user: req.user._id }, { postUserId: req.user._id }],
            });

            await Post.findOneAndUpdate(
                { _id: comment.postId },
                {
                    $pull: { comments: req.params.id },
                }
            );

            res.json({ msg: "Deleted Comment" });
        } catch (err) {
            return res.status(500).json({ msg: err.message });
        }
    },
};
module.exports = commentController;