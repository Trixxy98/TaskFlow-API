const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { db } = require("../config/database");

const sendServerError = (res, error) =>
  res.status(500).json({ success: false, message: error.message });

const REFRESH_TOKEN_EXPIRES_DAYS = 7;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
};

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const generateAndStoreRefreshToken = async (userId) => {
  const rawToken = crypto.randomBytes(40).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);

  // Delete existing tokens for this user (single active session per user)
  await db.query("DELETE FROM refresh_tokens WHERE user_id = ?", [userId]);

  await db.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt]
  );

  return rawToken;
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Semua field diperlukan" });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Email sudah didaftarkan" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: "Akaun berjaya didaftarkan",
      data: { id: result.insertId, name, email },
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email dan password diperlukan" });
    }

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Email atau password salah" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Email atau password salah" });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    const rawRefreshToken = await generateAndStoreRefreshToken(user.id);
    res.cookie("refreshToken", rawRefreshToken, COOKIE_OPTIONS);

    res.json({
      success: true,
      message: "Login berjaya",
      data: {
        token: accessToken,
        user: { id: user.id, name: user.name, email: user.email },
      },
    });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) {
      return res.status(401).json({ success: false, message: "Refresh token tidak dijumpai" });
    }

    const tokenHash = hashToken(rawToken);
    const [rows] = await db.query(
      "SELECT * FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()",
      [tokenHash]
    );

    if (rows.length === 0) {
      res.clearCookie("refreshToken", COOKIE_OPTIONS);
      return res.status(401).json({ success: false, message: "Refresh token tidak sah atau telah tamat" });
    }

    const storedToken = rows[0];
    const [userRows] = await db.query("SELECT id, name, email FROM users WHERE id = ?", [storedToken.user_id]);
    if (userRows.length === 0) {
      return res.status(401).json({ success: false, message: "User tidak dijumpai" });
    }

    const user = userRows[0];

    // Rotate: delete old refresh token, issue new one
    const newRawRefreshToken = await generateAndStoreRefreshToken(user.id);
    res.cookie("refreshToken", newRawRefreshToken, COOKIE_OPTIONS);

    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
    );

    res.json({ success: true, data: { token: accessToken } });
  } catch (error) {
    return sendServerError(res, error);
  }
};

const logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    if (rawToken) {
      const tokenHash = hashToken(rawToken);
      await db.query("DELETE FROM refresh_tokens WHERE token_hash = ?", [tokenHash]);
    }
    res.clearCookie("refreshToken", COOKIE_OPTIONS);
    res.json({ success: true, message: "Logout berjaya" });
  } catch (error) {
    return sendServerError(res, error);
  }
};

module.exports = { register, login, refreshAccessToken, logout };
