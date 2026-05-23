const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const { testConnection } = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/team", require("./routes/teamRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
}, express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({ message: "🚀 TaskFlow API is running!" });
});

const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();