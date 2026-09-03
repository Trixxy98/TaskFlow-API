const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/authMiddleware");
const requireFeature = require("../middleware/requireFeature");
const { db } = require("../config/database");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (JPG, PNG, GIF, WEBP) and PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(auth);

/**
 * @swagger
 * tags:
 *   name: Uploads
 *   description: File attachment endpoints
 */

/**
 * @swagger
 * /api/upload/{taskId}:
 *   post:
 *     summary: Upload a file attachment for a task
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image (JPG, PNG, GIF, WEBP) or PDF, max 5MB
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Attachment'
 *       400:
 *         description: No file uploaded or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/:taskId", requireFeature("attachments"), upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file was uploaded" });

    const { taskId } = req.params;

    const [result] = await db.query(
      "INSERT INTO task_attachments (task_id, filename, originalname, mimetype, size) VALUES (?, ?, ?, ?, ?)",
      [taskId, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size]
    );

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        task_id: taskId,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
      },
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @swagger
 * /api/upload/{taskId}:
 *   get:
 *     summary: Get all attachments for a task
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *         description: Task ID
 *     responses:
 *       200:
 *         description: List of attachments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attachment'
 */
router.get("/:taskId", async (req, res) => {
  try {
    const [attachments] = await db.query(
      "SELECT * FROM task_attachments WHERE task_id = ? ORDER BY created_at DESC",
      [req.params.taskId]
    );
    const data = attachments.map((a) => ({ ...a, url: `/uploads/${a.filename}` }));
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * @swagger
 * /api/upload/file/{id}:
 *   delete:
 *     summary: Delete a file attachment
 *     tags: [Uploads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: Attachment ID
 *     responses:
 *       200:
 *         description: File deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/file/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM task_attachments WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: "File not found" });

    const filePath = path.join(__dirname, "../../uploads", rows[0].filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.query("DELETE FROM task_attachments WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
