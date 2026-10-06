const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const requireFeature = require("../middleware/requireFeature");
const validate = require("../middleware/validate");
const noteValidators = require("../validators/note.validators");
const noteService = require("../services/noteService");

router.use(auth);
router.use(requireFeature("notes"));

/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Pro-only synced notes pages
 */

router.get("/", async (req, res, next) => {
  try {
    const data = await noteService.listNotes(req.user.id);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(noteValidators.createNote), async (req, res, next) => {
  try {
    const data = await noteService.createNote(req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", validate(noteValidators.updateNote), async (req, res, next) => {
  try {
    const data = await noteService.updateNote(req.params.id, req.user.id, req.body);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await noteService.deleteNote(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;