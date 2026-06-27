const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const authValidators = require("../validators/auth.validators");

router.post("/register", authLimiter, validate(authValidators.register), authController.register);
router.post("/login", authLimiter, validate(authValidators.login), authController.login);
router.post("/refresh", authController.refreshAccessToken);
router.post("/logout", authController.logout);
router.post("/forgot-password", authLimiter, validate(authValidators.forgotPassword), authController.forgotPassword);
router.post("/reset-password", validate(authValidators.resetPassword), authController.resetPassword);

module.exports = router;
