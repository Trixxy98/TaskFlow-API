const Joi = require("joi");

const PRIORITY = ["low", "medium", "high"];
const KANBAN_STATUS = ["todo", "inprogress", "done"];
const STATUS = ["pending", "completed"];

const createTask = Joi.object({
  title: Joi.string().min(1).max(255).trim().required().messages({
    "string.empty": "Task title cannot be empty",
    "any.required": "Task title is required",
  }),
  description: Joi.string().allow("", null).optional(),
  due_date: Joi.date().iso().allow(null).optional().messages({
    "date.format": "Invalid date format. Use the YYYY-MM-DD format",
  }),
  priority: Joi.string().valid(...PRIORITY).default("medium").messages({
    "any.only": `Priority must be one of: ${PRIORITY.join(", ")}`,
  }),
  kanban_status: Joi.string().valid(...KANBAN_STATUS).default("todo").messages({
    "any.only": `Kanban status must be one of: ${KANBAN_STATUS.join(", ")}`,
  }),
  project: Joi.string().max(100).allow("", null).optional(),
});

const updateTask = Joi.object({
  title: Joi.string().min(1).max(255).trim().optional(),
  description: Joi.string().allow("", null).optional(),
  status: Joi.string().valid(...STATUS).optional().messages({
    "any.only": `Status must be one of: ${STATUS.join(", ")}`,
  }),
  due_date: Joi.date().iso().allow(null).optional().messages({
    "date.format": "Invalid date format. Use the YYYY-MM-DD format",
  }),
  priority: Joi.string().valid(...PRIORITY).optional().messages({
    "any.only": `Priority must be one of: ${PRIORITY.join(", ")}`,
  }),
  kanban_status: Joi.string().valid(...KANBAN_STATUS).optional().messages({
    "any.only": `Kanban status must be one of: ${KANBAN_STATUS.join(", ")}`,
  }),
  project: Joi.string().max(100).allow("", null).optional(),
}).min(1).messages({
  "object.min": "At least one field must be provided to update",
});

module.exports = { createTask, updateTask };
