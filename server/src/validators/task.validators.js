const Joi = require("joi");

const PRIORITY = ["low", "medium", "high"];
const KANBAN_STATUS = ["todo", "inprogress", "done"];
const STATUS = ["pending", "completed"];

const createTask = Joi.object({
  title: Joi.string().min(1).max(255).trim().required().messages({
    "string.empty": "Tajuk task tidak boleh kosong",
    "any.required": "Tajuk task diperlukan",
  }),
  description: Joi.string().allow("", null).optional(),
  due_date: Joi.date().iso().allow(null).optional().messages({
    "date.format": "Format tarikh tidak sah. Guna format YYYY-MM-DD",
  }),
  priority: Joi.string().valid(...PRIORITY).default("medium").messages({
    "any.only": `Keutamaan mesti salah satu daripada: ${PRIORITY.join(", ")}`,
  }),
  kanban_status: Joi.string().valid(...KANBAN_STATUS).default("todo").messages({
    "any.only": `Status Kanban mesti salah satu daripada: ${KANBAN_STATUS.join(", ")}`,
  }),
  project: Joi.string().max(100).allow("", null).optional(),
});

const updateTask = Joi.object({
  title: Joi.string().min(1).max(255).trim().optional(),
  description: Joi.string().allow("", null).optional(),
  status: Joi.string().valid(...STATUS).optional().messages({
    "any.only": `Status mesti salah satu daripada: ${STATUS.join(", ")}`,
  }),
  due_date: Joi.date().iso().allow(null).optional().messages({
    "date.format": "Format tarikh tidak sah. Guna format YYYY-MM-DD",
  }),
  priority: Joi.string().valid(...PRIORITY).optional().messages({
    "any.only": `Keutamaan mesti salah satu daripada: ${PRIORITY.join(", ")}`,
  }),
  kanban_status: Joi.string().valid(...KANBAN_STATUS).optional().messages({
    "any.only": `Status Kanban mesti salah satu daripada: ${KANBAN_STATUS.join(", ")}`,
  }),
  project: Joi.string().max(100).allow("", null).optional(),
}).min(1).messages({
  "object.min": "Sekurang-kurangnya satu field perlu disertakan untuk kemaskini",
});

module.exports = { createTask, updateTask };
