const Joi = require("joi");

const createProject = Joi.object({
  name: Joi.string().min(1).max(100).trim().required().messages({
    "string.empty": "Nama projek tidak boleh kosong",
    "any.required": "Nama projek diperlukan",
  }),
  color: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .default("#6366f1")
    .optional()
    .messages({
      "string.pattern.base": "Warna mesti dalam format hex yang sah (contoh: #fff atau #6366f1)",
    }),
});

module.exports = { createProject };
