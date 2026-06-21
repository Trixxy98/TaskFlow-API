const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const projectValidators = require("../validators/project.validators");
const projectService = require("../services/projectService");

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const data = await projectService.getProjectsByUser(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(projectValidators.createProject), async (req, res, next) => {
  try {
    const { name, color } = req.body;
    const data = await projectService.createProject(req.user.id, name, color);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await projectService.deleteProject(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
