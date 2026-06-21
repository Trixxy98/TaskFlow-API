const Joi = require("joi");

const ROLES = ["owner", "admin", "member"];

const invite = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Format email tidak sah",
    "any.required": "Email diperlukan",
  }),
  role: Joi.string().valid(...ROLES).default("member").messages({
    "any.only": `Peranan mesti salah satu daripada: ${ROLES.join(", ")}`,
  }),
});

const updateRole = Joi.object({
  role: Joi.string().valid(...ROLES).required().messages({
    "any.only": `Peranan mesti salah satu daripada: ${ROLES.join(", ")}`,
    "any.required": "Peranan diperlukan",
  }),
});

module.exports = { invite, updateRole };
