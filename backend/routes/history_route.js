// routes/history_route.js
const express = require('express');
const db = require('../db');
const requireAuth = require('../middlewares/authRequired'); // ตรวจ JWT เหมือน route อื่น
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: History
 *     description: จัดการประวัติการค้นหาพัสดุของผู้ใช้
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     HistoryItem:
 *       type: object
 *       properties:
 *         history_id:
 *           type: integer
 *           example: 12
 *         package_id:
 *           type: integer
 *           example: 101
 *         search_time:
 *           type: string
 *           format: date-time
 *           example: "2025-10-27T14:23:45.000Z"
 *         sender_name:
 *           type: string
 *           nullable: true
 *           example: "สมชาย"
 *         receiver_name:
 *           type: string
 *           nullable: true
 *           example: "สมหญิง"
 *         status:
 *           type: string
 *           nullable: true
 *           example: "กำลังขนส่ง"
 *         province:
 *           type: string
 *           nullable: true
 *           example: "กรุงเทพมหานคร"
 *         post_code:
 *           type: string
 *           nullable: true
 *           example: "10240"
 *
 *     HistoryCreateRequest:
 *       type: object
 *       required:
 *         - package_id
 *       properties:
 *         package_id:
 *           type: integer
 *           example: 101
 *
 *     CreateHistoryResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "เพิ่มประวัติแล้ว"
 *         history_id:
 *           type: integer
 *           example: 12
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "เกิดข้อผิดพลาดในเซิร์ฟเวอร์"
 */

/**
 * @swagger
 * /api/v1/history:
 *   get:
 *     tags: [History]
 *     summary: ดึงรายการประวัติการค้นพัสดุของผู้ใช้ปัจจุบัน
 *     description: คืนค่ารายการพัสดุที่ผู้ใช้เคยกดดู (เช็คผู้ใช้จาก JWT)  อัพเดตเรียงตามเวลาล่าสุดก่อน
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HistoryItem'
 *       401:
 *         description: ไม่ได้ยืนยันตัวตน (ไม่มี/หมดอายุของ JWT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// ดึงประวัติการค้นหาพัสดุของ user คนนั้น + รูปพัสดุ
router.get('/history', requireAuth, (req, res) => {
  const sql = `
    SELECT 
      h.history_id,
      h.package_id,
      h.search_time,
      p.sender_name,
      p.receiver_name,
      p.status,
      p.province,
      p.post_code,
      p.package_img AS image_url  
    FROM History h
    LEFT JOIN Package p ON h.package_id = p.package_id
    WHERE h.user_id = ?
    ORDER BY datetime(h.search_time) DESC
  `;

  db.all(sql, [req.user.user_id], (err, rows) => {
    if (err) {
      console.error("GET /history error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});



// /**
//  * @swagger
//  * /api/v1/history:
//  *   post:
//  *     tags: [History]
//  *     summary: เพิ่มประวัติว่าเคยค้นหาพัสดุ
//  *     description: บันทึกว่า user เคยค้นหาพัสดุนั้น (จาก JWT)
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/HistoryCreateRequest'
//  *     responses:
//  *       201:
//  *         description: เพิ่มประวัติเรียบร้อย
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/CreateHistoryResponse'
//  *       400:
//  *         description: คำขอไม่ถูกต้อง (เช่น ไม่ส่ง package_id)
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  *       401:
//  *         description: ไม่ได้ยืนยันตัวตน (ไม่มี/หมดอายุของ JWT)
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  *       500:
//  *         description: เซิร์ฟเวอร์ผิดพลาด
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/ErrorResponse'
//  */
router.post('/history', requireAuth, (req, res) => {
  const { package_id } = req.body;
  if (!package_id) return res.status(400).json({ error: 'ต้องระบุ package_id' });

  const sql = `INSERT INTO History (user_id, package_id) VALUES (?, ?)`;
  db.run(sql, [req.user.user_id, package_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'เพิ่มประวัติแล้ว', history_id: this.lastID });
  });
});

/**
 * @swagger
 * /api/v1/history/{id}:
 *   delete:
 *     tags: [History]
 *     summary: ลบประวัติการค้นของตัวผู้ใช้เอง
 *     description: ลบรายการประวัติด้วย history_id เฉพาะของผู้ใช้ที่เข้าสู่ระบบเท่านั้น
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: history_id ที่ต้องการลบ
 *     responses:
 *       204:
 *         description: ลบสำเร็จ (ไม่มีเนื้อหาใน response)
 *       400:
 *         description: พารามิเตอร์ไม่ถูกต้อง (id ไม่ใช่ตัวเลข)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: ไม่ได้ยืนยันตัวตน (ไม่มี/หมดอายุของ JWT)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: ไม่พบรายการ หรือไม่ใช่ของผู้ใช้คนนี้
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/history/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid history_id' });

  const sql = `DELETE FROM History WHERE history_id = ? AND user_id = ?`;
  db.run(sql, [id, req.user.user_id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: 'ไม่พบรายการนี้ หรือไม่ใช่ของคุณ' });
    res.status(204).send();
  });
});

module.exports = router;
