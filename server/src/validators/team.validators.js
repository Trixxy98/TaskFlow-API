const Joi = require("joi");

const ROLES = ["owner", "admin", "member"];

const invite = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  role: Joi.string().valid(...ROLES).default("member").messages({
    "any.only": `Role must be one of: ${ROLES.join(", ")}`,
  }),
});

const updateRole = Joi.object({
  role: Joi.string().valid(...ROLES).required().messages({
    "any.only": `Role must be one of: ${ROLES.join(", ")}`,
    "any.required": "Role is required",
  }),
});

module.exports = { invite, updateRole };
