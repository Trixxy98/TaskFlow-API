const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");
const teamValidators = require("../validators/team.validators");
const teamService = require("../services/teamService");

router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const { members, workspace } = await teamService.getMembers(req.user.id);
    res.json({ success: true, data: members, workspace });
  } catch (err) {
    next(err);
  }
});

router.post("/invite", validate(teamValidators.invite), async (req, res, next) => {
  try {
    const { email, role } = req.body;
    const data = await teamService.inviteMember(req.user.id, email, role);
    res.status(201).json({ success: true, message: `${data.name} berjaya dijemput!`, data });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/role", validate(teamValidators.updateRole), async (req, res, next) => {
  try {
    const workspace = await teamService.getOrCreateWorkspace(req.user.id);
    await teamService.updateMemberRole(req.params.id, workspace.id, req.body.role);
    res.json({ success: true, message: "Role berjaya dikemaskini" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const workspace = await teamService.getOrCreateWorkspace(req.user.id);
    await teamService.removeMember(req.params.id, workspace.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
