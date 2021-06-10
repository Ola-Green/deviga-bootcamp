require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { ExpressPeerServer } = require("peer");
const cookieParser = require("cookie-parser");
const path = require("path");
const SocketServer = require("./socketServer");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notifyRoutes = require("./routes/notifyRoutes");
const messageRoutes = require("./routes/messageRoutes");

const { PORT, MONGODB_URL } = process.env;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors());

const http = require("http").createServer(app);
const io = require("socket.io")(http);

io.on("connection", (socket) => {
  SocketServer(socket);
});

// Create peer server
ExpressPeerServer(http, { path: "/" });

app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", postRoutes);
app.use("/api", commentRoutes);
app.use("/api", notifyRoutes);
app.use("/api", messageRoutes);

mongoose
  .connect(MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => console.log("Database connection established"))
  .catch((err) => console.log(err.reason));

if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });
}

http.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
