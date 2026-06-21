const rateLimit = require("express-rate-limit");

/**
 * Untuk auth endpoints (login, register).
 * Had: 10 request setiap 15 minit per IP.
 * Elakkan brute-force serangan ke atas kata laluan.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak percubaan. Sila cuba lagi selepas 15 minit.",
  },
});

/**
 * Untuk semua API endpoint umum.
 * Had: 100 request setiap 1 minit per IP.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak request. Sila cuba lagi sebentar.",
  },
});

module.exports = { authLimiter, apiLimiter };
