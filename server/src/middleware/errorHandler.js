/**
 * Global error handling middleware.
 * Mesti didaftarkan sebagai middleware TERAKHIR dalam index.js.
 * Tangkap semua error yang dipass melalui next(err).
 */
const errorHandler = (err, req, res, next) => {
  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Token tidak sah." });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token telah tamat tempoh. Sila login semula." });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, message: "Saiz fail melebihi had 5MB." });
  }

  // Multer file type error (dilempar sebagai Error biasa dalam fileFilter)
  if (err.message && err.message.startsWith("Hanya gambar")) {
    return res.status(415).json({ success: false, message: err.message });
  }

  // MySQL duplicate entry
  if (err.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ success: false, message: "Data sudah wujud." });
  }

  // Log error penuh untuk debugging (server-side sahaja, tidak didedahkan ke client)
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);

  // Default: 500 Internal Server Error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Ralat pelayan dalaman. Sila cuba lagi."
        : err.message,
  });
};

module.exports = errorHandler;
