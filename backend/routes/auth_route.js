// routes/auth_route.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db'); 
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Authen
 *     description: สมัครสมาชิก/เข้าสู่ระบบ
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
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
 *       required:
 *         - user_id
 *         - username
 *         - email
 *         - phone
 *         - role
 *
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - email
 *         - phone
 *       properties:
 *         username:
 *           type: string
 *           example: "user01"
 *         password:
 *           type: string
 *           minLength: 8
 *           example: "12345678"
 *         email:
 *           type: string
 *           format: email
 *           example: "user01@mail.com"
 *         phone:
 *           type: string
 *           example: "0812345678"
 *
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "สมัครสมาชิกสำเร็จ"
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           example: "user01"
 *         password:
 *           type: string
 *           example: "12345678"
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "login สำเร็จ"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง"
 */


/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authen]
 *     summary: สมัครสมาชิก
 *     description: บังคับเพิ่มชื่อผู้ใช้ รหัสผ่าน email เบอร์โทรศัพท์ ให้ครบถึงจะสมัครใช้งานได้
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             default:
 *               value:
 *                 username: "nat"
 *                 password: "secret123"
 *                 email: "nat@example.com"
 *                 phone: "0812345678"
 *     responses:
 *       201:
 *         description: สมัครสมาชิกสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       400:
 *         description: ข้อมูลไม่ครบหรือไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: username หรือ email ถูกใช้แล้ว
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, phone } = req.body;
    if (!username || !password || !email || !phone) {
      return res.status(400).json({ error: 'ต้องกรอก username, password, email และ phone ให้ครบ' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'password ต้องยาวอย่างน้อย 8 ตัวอักษร' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const sql = `
      INSERT INTO User (username, password, email, phone, role)
      VALUES (?, ?, ?, ?, 'user')
    `;
    db.run(sql, [username, hashed, email, phone], function (err) {
      if (err) {
        if (String(err.message).includes('UNIQUE')) {
          return res.status(409).json({ error: 'username หรือ email ถูกใช้แล้ว' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({
        message: 'สมัครสมาชิกสำเร็จ',
        user: { user_id: this.lastID, username, email, phone, role: 'user' }
      });
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authen]
 *     summary: เข้าสู่ระบบ
 *     description: ใส่ username และ password ให้ตรงกับข้อมูลในฐานข้อมูล จะได้รับ jwt token สำหรับยืนยันตัวตนในหน้าอื่นๆ Username win1234 (system_manager)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           examples:
 *             default:
 *               value:
 *                 username: "win1234"
 *                 password: "password"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ พร้อม JWT token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: กรอกข้อมูลไม่ครบ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'กรอก username และ password' });

  const sql = `SELECT user_id, username, password, email, phone, role FROM User WHERE username = ?`;
  db.get(sql, [username], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

    const ok = await bcrypt.compare(password, row.password);
    if (!ok) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });

    // ออก JWT
    const payload = { user_id: row.user_id, role: row.role };
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const token = jwt.sign(payload, secret, { expiresIn: '2h' });

    res.json({
      message: 'login สำเร็จ',
      token,
      user: {
        user_id: row.user_id,
        username: row.username,
        email: row.email,
        phone: row.phone,
        role: row.role
      }
    });
  });
});

module.exports = router;
