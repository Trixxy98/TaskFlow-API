const express = require("express");
const router = express.Router();
const taskController = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const taskValidators = require("../validators/task.validators");

router.use(authMiddleware);

router.get("/", taskController.getAllTasks);
router.post("/", validate(taskValidators.createTask), taskController.createTask);
router.put("/:id", validate(taskValidators.updateTask), taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;