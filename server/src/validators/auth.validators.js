const Joi = require("joi");

const register = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    "string.min": "Name must be at least 2 characters long",
    "string.max": "Name must not exceed 100 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
});

const resetPassword = Joi.object({
  token: Joi.string().required().messages({
    "any.required": "Token is required",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "New password is required",
  }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Password confirmation does not match",
    "any.required": "Password confirmation is required",
  }),
});

module.exports = { register, login, forgotPassword, resetPassword };
