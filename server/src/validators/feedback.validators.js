const Joi = require("joi");

const createFeedback = Joi.object({
  task_id: Joi.number().integer().positive().required().messages({
    "number.base": "task_id mesti nombor yang sah",
    "number.positive": "task_id mesti nombor positif",
    "any.required": "task_id diperlukan",
  }),
  message: Joi.string().min(1).max(2000).trim().required().messages({
    "string.empty": "Mesej tidak boleh kosong",
    "string.max": "Mesej tidak boleh melebihi 2000 aksara",
    "any.required": "Mesej diperlukan",
  }),
});

module.exports = { createFeedback };
