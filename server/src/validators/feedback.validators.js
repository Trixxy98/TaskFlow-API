const Joi = require("joi");

const createFeedback = Joi.object({
  task_id: Joi.number().integer().positive().required().messages({
    "number.base": "task_id must be a valid number",
    "number.positive": "task_id must be a positive number",
    "any.required": "task_id is required",
  }),
  message: Joi.string().min(1).max(2000).trim().required().messages({
    "string.empty": "Message cannot be empty",
    "string.max": "Message must not exceed 2000 characters",
    "any.required": "Message is required",
  }),
});

module.exports = { createFeedback };
