// routes/userinfo_route.js
const express = require('express');
const db = require('../db');  // ใช้ connection ร่วม
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: UserInfo
 *     description: จัดการข้อมูลผู้ใช้
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           example: 1
 *         username:
 *           type: string
 *           example: "natthapong"
 *         email:
 *           type: string
 *           example: "user@example.com"
 *         phone:
 *           type: string
 *           example: "0812345678"
 *         role:
 *           type: string
 *           example: "user"
 *       required: [user_id, username, email, phone, role]
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "ไม่สามารถดึงข้อมูลผู้ใช้ได้"
 */

/**
 * @swagger
 * /api/v1/userinfo:
 *   get:
 *     tags: [UserInfo]
 *     summary: ดึงข้อมูลผู้ใช้ทั้งหมดทุกรายชื่อ
 *     description: แสดงรายชื่อผู้ใช้ทั้งหมดพร้อมรายละเอียดจากฐานข้อมูล
 *     responses:
 *       200:
 *         description: ดึงข้อมูลผู้ใช้สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: เกิดข้อผิดพลาดในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/userinfo', (req, res) => {
  const sql = `
    SELECT user_id, username, email, phone, role
    FROM User
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
