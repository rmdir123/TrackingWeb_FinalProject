// routes/robotmode_route.js
const express = require('express');
const db = require('../db');
const router = express.Router();

console.log("manager_route loaded");

/**
 * @swagger
 * tags:
 *   - name: RobotMode
 *     description: จัดการสถานะโหมดการทำงานของหุ่นยนต์
 *
 * components:
 *   schemas:
 *     RobotMode:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "ocr"
 *
 *     RobotModeResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "RobotMode updated successfully"
 *         status:
 *           type: string
 *           example: "ocr"
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Database error"
 */

/**
 * @swagger
 * /api/v1/robotmode:
 *   get:
 *     tags: [RobotMode]
 *     summary: ดึงสถานะ RobotMode ปัจจุบัน
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RobotMode'
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 */

/**
 * @swagger
 * /api/v1/robotmode:
 *   put:
 *     tags: [RobotMode]
 *     summary: อัปเดตสถานะ RobotMode
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: "ocr"
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RobotModeResponse'
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง
 *       500:
 *         description: Database error
 */

// ======================= API START =========================

// GET RobotMode
router.get('/robotmode', async (req, res) => {
  const sql = `SELECT status FROM RobotMode LIMIT 1`;

  try {
    const [rows] = await db.query(sql);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'RobotMode not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE RobotMode
router.put('/robotmode', async (req, res) => {
  const { status } = req.body || {};

  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  const sql = `UPDATE RobotMode SET status = ?`;

  try {
    const [result] = await db.query(sql, [status]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'RobotMode not found' });
    }

    res.json({
      message: 'RobotMode updated successfully',
      status: status
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
