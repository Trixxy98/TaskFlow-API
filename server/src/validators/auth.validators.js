const Joi = require("joi");

const register = Joi.object({
  name: Joi.string().min(2).max(100).trim().required().messages({
    "string.min": "Nama mestilah sekurang-kurangnya 2 aksara",
    "string.max": "Nama tidak boleh melebihi 100 aksara",
    "any.required": "Nama diperlukan",
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Format email tidak sah",
    "any.required": "Email diperlukan",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Kata laluan mestilah sekurang-kurangnya 8 aksara",
    "any.required": "Kata laluan diperlukan",
  }),
});

const login = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Format email tidak sah",
    "any.required": "Email diperlukan",
  }),
  password: Joi.string().required().messages({
    "any.required": "Kata laluan diperlukan",
  }),
});

module.exports = { register, login };
