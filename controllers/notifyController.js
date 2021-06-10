const Notify = require("../models/notifyModel");


const notifyControllers = {
    createNotify: async (req, res) => {
        try {
            const {id, recipients, url, text, content, image} = req.body

            if (recipients.includes(req.user._id.toString())) return;

            const notify = new Notify({
                id, recipients, url, text, content, image, user: req.user._id
            })

            await notify.save();
            return res.json({notify});

        } catch (err) {
            return res.status(500).json({msg: err.message});
        }

    },

    removeNotify: async (req, res) => {
        try {
            const notify = await Notify.findOneAndDelete({
                id: req.params.id, url: req.query.url
            });

            return res.json({notify});
        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    },

    getNotifies: async (req, res) => {
        try {
            const notifies = await Notify.find({
                recipients: req.user._id
            }).sort("-createdAt").populate("user", "avatar username");

            return res.json({notifies});

        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    },
    isReadNotify: async (req, res) => {
        try {
            const notifies = await Notify.findOneAndUpdate({_id: req.params.id}, {isRead: true});
            return res.json({notifies});

        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    },

    deleteAllNotifies: async (req, res) => {
        try {
            const notifies = await Notify.deleteMany({recipients: req.user._id});
            return res.json({notifies});

        } catch (err) {
            return res.status(500).json({msg: err.message});
        }
    }
}

module.exports = notifyControllers;