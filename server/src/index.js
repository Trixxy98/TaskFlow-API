const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const { testConnection } = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const { apiLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";

app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/team", require("./routes/teamRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/uploads", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  next();
}, express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({ message: "🚀 TaskFlow API is running!" });
});

app.use(errorHandler);

const startServer = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();