// routes/auth_route.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const nodemailer = require('nodemailer');

const router = express.Router();
const isDev = process.env.NODE_ENV !== 'production';

// ---------- ตั้งค่า Nodemailer (ส่งเมล OTP) ----------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// เพิ่มบรรทัดนี้ชั่วคราว
console.log('SMTP CONFIG >>>', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
});


// ตรวจว่า SMTP ใช้งานได้ไหม (แค่ log ไว้เฉยๆ)
transporter.verify((err, success) => {
  if (err) {
    console.warn('⚠️  SMTP not ready (check SMTP env / internet):', err.message);
  } else {
    console.log('✅ SMTP server is ready to send emails');
  }
});

// ---------- สร้างตารางเก็บ OTP ถ้ายังไม่มี ----------
const initOtpTableSql = `
  CREATE TABLE IF NOT EXISTS PasswordResetOtp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    ip_address TEXT,
    FOREIGN KEY (user_id) REFERENCES User(user_id)
  )
`;
db.run(initOtpTableSql, (err) => {
  if (err) {
    console.error('Error creating PasswordResetOtp table:', err.message);
  } else {
    console.log('PasswordResetOtp table ready.');
  }
});

/**
 * @swagger
 * tags:
 *   - name: Authen
 *     description: สมัครสมาชิก/เข้าสู่ระบบ และกู้คืนรหัสผ่านด้วย OTP
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
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
 *     ForgotPasswordEmailRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user01@mail.com"
 *
 *     ForgotPasswordEmailResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "หาก email นี้อยู่ในระบบ ระบบได้ส่ง OTP ไปที่อีเมลแล้ว"
 *         otp:
 *           type: string
 *           description: "โหมด DEV เท่านั้น (ใน production ไม่ควรส่งออกไป)"
 *           example: "123456"
 *
 *     VerifyOtpRequest:
 *       type: object
 *       required:
 *         - email
 *         - otp
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "user01@mail.com"
 *         otp:
 *           type: string
 *           example: "123456"
 *
 *     VerifyOtpResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "OTP ถูกต้อง"
 *         reset_token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *
 *     ResetPasswordWithTokenRequest:
 *       type: object
 *       required:
 *         - reset_token
 *         - new_password
 *       properties:
 *         reset_token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         new_password:
 *           type: string
 *           minLength: 8
 *           example: "newpassword123"
 *
 *     ResetPasswordResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "เปลี่ยนรหัสผ่านสำเร็จแล้ว สามารถนำรหัสผ่านใหม่ไปใช้เข้าสู่ระบบได้"
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
      return res
        .status(400)
        .json({ error: 'ต้องกรอก username, password, email และ phone ให้ครบ' });
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
        user: { user_id: this.lastID, username, email, phone, role: 'user' },
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
        role: row.role,
      },
    });
  });
});

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags: [Authen]
 *     summary: ขอ OTP สำหรับรีเซ็ตรหัสผ่าน (ส่งทางอีเมล)
 *     description: |
 *       ผู้ใช้กรอกอีเมล ระบบจะสร้างรหัส OTP 6 หลัก อายุ 10 นาที แล้วส่งไปที่อีเมลนั้น  
 *       - ถ้า email ไม่อยู่ในระบบ จะตอบ message เหมือนกันเพื่อความปลอดภัย  
 *       - ในโหมด DEV จะส่ง `otp` กลับมาใน response เพื่อเอาไปลองกับ /verify-otp หรือ /reset-password ได้ง่าย ๆ  
 *       - ใน production ไม่ควรส่ง `otp` ออกมาทาง API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordEmailRequest'
 *           examples:
 *             default:
 *               value:
 *                 email: "user01@mail.com"
 *     responses:
 *       200:
 *         description: ถ้า email อยู่ในระบบ ระบบได้ส่ง OTP ไปที่อีเมลแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ForgotPasswordEmailResponse'
 *       400:
 *         description: กรอก email ไม่ถูกต้อง
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
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'กรุณากรอก email',
    });
  }

  const findUserSql = `SELECT user_id, email FROM User WHERE email = ? LIMIT 1`;
  db.get(findUserSql, [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    // ถ้าไม่พบ user ก็ส่ง message เหมือนกัน (ไม่บอกให้รู้ว่า email นี้ใช้หรือยัง)
    if (!user) {
      return res.json({
        message: 'หาก email นี้อยู่ในระบบ ระบบได้ส่ง OTP ไปที่อีเมลแล้ว',
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000)); // OTP 6 หลัก
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 นาที
    const createdAt = Date.now();
    const ipAddress =
      (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
      req.ip ||
      '';

    // ลบ OTP เดิมของ user นี้ทิ้งก่อน
    const deleteOldSql = `DELETE FROM PasswordResetOtp WHERE user_id = ?`;
    db.run(deleteOldSql, [user.user_id], (delErr) => {
      if (delErr) {
        console.error('Error deleting old OTP:', delErr.message);
      }

      const insertSql = `
        INSERT INTO PasswordResetOtp (user_id, email, otp_code, expires_at, used, created_at, ip_address)
        VALUES (?, ?, ?, ?, 0, ?, ?)
      `;
      db.run(
        insertSql,
        [user.user_id, user.email, otp, expiresAt, createdAt, ipAddress],
        (insErr) => {
          if (insErr) {
            return res.status(500).json({ error: insErr.message });
          }

          // ส่งเมล OTP
          const mailOptions = {
            from:
              process.env.MAIL_FROM ||
              process.env.SMTP_USER ||
              'no-reply@example.com',
            to: user.email,
            subject: 'รหัส OTP สำหรับรีเซ็ตรหัสผ่าน',
            text: `รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณคือ ${otp} (มีอายุ 10 นาที)\n\nถ้าคุณไม่ได้ร้องขอการรีเซ็ตรหัสผ่าน สามารถละเว้นอีเมลฉบับนี้ได้`,
          };

          transporter.sendMail(mailOptions, (mailErr, info) => {
  if (mailErr) {
    console.error('Error sending OTP email:', mailErr);
    return res.status(500).json({ error: 'ไม่สามารถส่งอีเมล OTP ได้ โปรดลองใหม่อีกครั้ง' });
  }

  console.log('OTP email sent:', {
    to: mailOptions.to,
    messageId: info.messageId,
    response: info.response,
  });

  const response = {
    message: 'หาก email นี้อยู่ในระบบ ระบบได้ส่ง OTP ไปที่อีเมลแล้ว'
  };

  if (isDev) {
    response.otp = otp;
  }

  return res.json(response);
});

        }
      );
    });
  });
});

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     tags: [Authen]
 *     summary: ตรวจสอบ OTP และออก reset_token
 *     description: |
 *       ผู้ใช้กรอก email + otp  
 *       ถ้า OTP ถูกต้องและยังไม่หมดอายุ ระบบจะออก reset_token (JWT) สำหรับใช้รีเซ็ตรหัสผ่านในขั้นตอนถัดไป
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyOtpRequest'
 *           examples:
 *             default:
 *               value:
 *                 email: "user01@mail.com"
 *                 otp: "123456"
 *     responses:
 *       200:
 *         description: OTP ถูกต้อง และได้ reset_token กลับมา
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VerifyOtpResponse'
 *       400:
 *         description: OTP ไม่ถูกต้องหรือหมดอายุแล้ว
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
router.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res
      .status(400)
      .json({ error: 'กรุณากรอก email และ otp ให้ครบ' });
  }

  const now = Date.now();
  const findOtpSql = `
    SELECT id, user_id, email, otp_code, expires_at, used
    FROM PasswordResetOtp
    WHERE email = ? AND otp_code = ? AND used = 0
    ORDER BY id DESC
    LIMIT 1
  `;

  db.get(findOtpSql, [email, otp], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!row) {
      return res.status(400).json({
        error: 'OTP ไม่ถูกต้องหรือถูกใช้ไปแล้ว',
      });
    }

    if (row.expires_at < now) {
      return res.status(400).json({
        error: 'OTP หมดอายุแล้ว',
      });
    }

    // mark OTP as used
    const markUsedSql = `UPDATE PasswordResetOtp SET used = 1 WHERE id = ?`;
    db.run(markUsedSql, [row.id], (markErr) => {
      if (markErr) {
        console.error('Error marking OTP as used:', markErr.message);
      }

      // ออก reset_token (JWT) สำหรับใช้ใน /reset-password
      const secret = process.env.JWT_SECRET || 'dev_secret';
      const resetToken = jwt.sign(
        { user_id: row.user_id, purpose: 'reset_password' },
        secret,
        { expiresIn: '10m' }
      );

      return res.json({
        message: 'OTP ถูกต้อง',
        reset_token: resetToken,
      });
    });
  });
});

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     tags: [Authen]
 *     summary: รีเซ็ตรหัสผ่านด้วย reset_token
 *     description: |
 *       ใช้ reset_token ที่ได้จาก /verify-otp ร่วมกับรหัสผ่านใหม่ในการตั้งรหัสผ่านใหม่  
 *       reset_token จะหมดอายุตามเวลาที่กำหนด (เช่น 10 นาที)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordWithTokenRequest'
 *           examples:
 *             default:
 *               value:
 *                 reset_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 new_password: "newpassword123"
 *     responses:
 *       200:
 *         description: เปลี่ยนรหัสผ่านสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResetPasswordResponse'
 *       400:
 *         description: reset_token ไม่ถูกต้อง / หมดอายุ / รหัสผ่านใหม่ไม่ผ่านเงื่อนไข
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
router.post('/reset-password', (req, res) => {
  const { reset_token, new_password } = req.body;

  if (!reset_token || !new_password) {
    return res.status(400).json({
      error: 'กรุณากรอก reset_token และ new_password ให้ครบ',
    });
  }

  if (new_password.length < 8) {
    return res.status(400).json({
      error: 'รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร',
    });
  }

  const secret = process.env.JWT_SECRET || 'dev_secret';

  let decoded;
  try {
    decoded = jwt.verify(reset_token, secret);
  } catch (error) {
    return res
      .status(400)
      .json({ error: 'reset_token ไม่ถูกต้องหรือหมดอายุ' });
  }

  if (!decoded || !decoded.user_id || decoded.purpose !== 'reset_password') {
    return res.status(400).json({ error: 'reset_token ไม่ถูกต้อง' });
  }

  const userId = decoded.user_id;

  bcrypt
    .hash(new_password, 12)
    .then((hashed) => {
      const updateUserSql = `UPDATE User SET password = ? WHERE user_id = ?`;
      db.run(updateUserSql, [hashed, userId], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }

        return res.json({
          message:
            'เปลี่ยนรหัสผ่านสำเร็จแล้ว สามารถนำรหัสผ่านใหม่ไปใช้เข้าสู่ระบบได้',
        });
      });
    })
    .catch((hashErr) => {
      return res.status(500).json({ error: hashErr.message });
    });
});

module.exports = router;
