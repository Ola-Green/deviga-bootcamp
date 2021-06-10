const Message = require("../models/messageModel");
const Conversation = require("../models/conversationModel");

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

const messageControllers = {
  createMessage: async (req, res) => {
    try {
      const { sender, recipient, text, media, call } = req.body;
      if (!recipient || (!text.trim() && media.length === 0 && !call)) return;

      const newConversation = await Conversation.findOneAndUpdate(
        {
          $or: [
            { recipients: [sender, recipient] },
            { recipients: [recipient, sender] },
          ],
        },
        { recipients: [sender, recipient], text, media, call },
        { new: true, upsert: true }
      );

      const newMessage = new Message({
        conversation: newConversation._id,
        sender,
        call,
        recipient,
        text,
        media,
      });

      await newMessage.save();

      res.json({ msg: "Success" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getConversations: async (req, res) => {
    try {
      const features = new ApiFeatures(
        Conversation.find({
          recipients: req.user._id,
        }),
        req.query
      ).paginating();

      const conversations = await features.query
        .sort("-updatedAt")
        .populate("recipients", "avatar username fullName");

      res.json({ conversations, result: conversations.length });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  getMessages: async (req, res) => {
    try {
      const features = new ApiFeatures(
        Message.find({
          $or: [
            { sender: req.user._id, recipient: req.params.id },
            { sender: req.params.id, recipient: req.user._id },
          ],
        }),
        req.query
      ).paginating();

      const messages = await features.query.sort("-createdAt");
      res.json({ messages, result: messages.length });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteMessages: async (req, res) => {
    try {
      await Message.findOneAndDelete({
        _id: req.params.id,
        sender: req.user._id,
      });
      res.json({ msg: "Delete Success" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },

  deleteConversation: async (req, res) => {
    try {
      const newConvo = await Conversation.findOneAndDelete({
        $or: [
          { recipients: [req.user._id, req.params.id] },
          { recipients: [req.params.id, req.user._id] },
        ],
      });

      await Message.deleteMany({ conversation: newConvo._id });

      res.json({ msg: "Delete Success" });
    } catch (err) {
      return res.status(500).json({ msg: err.message });
    }
  },
};

module.exports = messageControllers;
