// routes/userinfo_route.js
const express = require('express');
const db = require('../db');
const authRequired = require('../middlewares/authRequired');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: UserInfo
 *   description: จัดการข้อมูลผู้ใช้ (ไม่รวม password)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserInfo:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: ไอดีของผู้ใช้ (Primary key)
 *         username:
 *           type: string
 *           description: ชื่อผู้ใช้
 *         email:
 *           type: string
 *           format: email
 *           description: อีเมลผู้ใช้
 *         phone:
 *           type: string
 *           description: เบอร์โทรศัพท์
 *         role:
 *           type: string
 *           description: บทบาทของผู้ใช้ เช่น user, admin
 *       example:
 *         user_id: 1
 *         username: "natthapong"
 *         email: "nat@example.com"
 *         phone: "0812345678"
 *         role: "user"
 */

/**
 * @swagger
 * /api/v1/userinfo:
 *   get:
 *     tags: [UserInfo]
 *     summary: ดึงข้อมูลผู้ใช้ทั้งหมด (admin เท่านั้น)
 *     description: |
 *       คืนรายการผู้ใช้ทั้งหมดในระบบ โดย **ไม่รวม password**  
 *       Endpoint นี้ต้องใช้สิทธิ์ **admin** เท่านั้น
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ดึงข้อมูลผู้ใช้ทั้งหมดสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserInfo'
 *       401:
 *         description: ไม่ได้ส่ง token หรือ token ไม่ถูกต้อง
 *       403:
 *         description: สิทธิ์ไม่เพียงพอ (ต้องเป็น admin)
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/userinfo', authRequired, (req, res) => {
  // ตรวจสอบสิทธิ์ admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: admin only' });
  }

  const sql = `
    SELECT user_id, username, email, phone, role
    FROM User
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/**
 * @swagger
 * /api/v1/userinfo/me:
 *   get:
 *     tags: [UserInfo]
 *     summary: ดึงข้อมูลของผู้ใช้ที่กำลังเข้าสู่ระบบอยู่
 *     description: |
 *       ใช้ JWT token เพื่อดึงข้อมูลของผู้ใช้คนนั้นเอง  
 *       **ไม่ดึง password** ออกมาโดยเด็ดขาด
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInfo'
 *       401:
 *         description: ไม่ได้ส่ง token หรือ token ไม่ถูกต้อง
 *       404:
 *         description: ไม่พบผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.get('/userinfo/me', authRequired, (req, res) => {
  const userId = req.user.user_id; // มาจาก payload ใน authRequired

  const sql = `
    SELECT user_id, username, email, phone, role
    FROM User
    WHERE user_id = ?
  `;

  db.get(sql, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'User not found' });
    res.json(row);
  });
});

module.exports = router;



/**
 * @swagger
 * /api/v1/userinfo/me:
 *   put:
 *     tags: [UserInfo]
 *     summary: แก้ไขข้อมูลของผู้ใช้ที่กำลังเข้าสู่ระบบ (เฉพาะเบอร์โทรศัพท์)
 *     description: |
 *       ใช้ JWT token เพื่ออัปเดตเบอร์โทรศัพท์ของผู้ใช้คนนั้นเอง  
 *       Endpoint นี้ **ไม่อนุญาตให้แก้ไข password หรือ role**
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *                 description: เบอร์โทรศัพท์ใหม่
 *             required:
 *               - phone
 *     responses:
 *       200:
 *         description: อัปเดตข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 phone:
 *                   type: string
 *       400:
 *         description: ข้อมูลที่ส่งมาไม่ถูกต้อง
 *       401:
 *         description: ไม่ได้ส่ง token หรือ token ไม่ถูกต้อง
 *       404:
 *         description: ไม่พบผู้ใช้
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 */
router.put('/userinfo/me', authRequired, (req, res) => {
  const userId = req.user.user_id;   // มาจาก payload ใน authRequired
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'กรุณาระบุเบอร์โทรศัพท์' });
  }

  const sql = `
    UPDATE User
    SET phone = ?
    WHERE user_id = ?
  `;

  db.run(sql, [phone, userId], function (err) {
    if (err) {
      console.error('Update phone error:', err);
      return res.status(500).json({ error: 'อัปเดตหมายเลขโทรศัพท์ไม่สำเร็จ' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'อัปเดตหมายเลขโทรศัพท์เรียบร้อยแล้ว',
      phone,
    });
  });
});
