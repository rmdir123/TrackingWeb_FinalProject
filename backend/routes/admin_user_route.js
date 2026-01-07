// routes/admin_user_route.js
const express = require("express");
const router = express.Router();
const db = require("../db"); 
const bcrypt = require("bcrypt");
const authRequired = require("../middlewares/authRequired");

/**
 * @swagger
 * /api/v1/admin/admins:
 *   get:
 *     tags: [AdminUser]
 *     summary: ดึงข้อมูลผู้ใช้ที่มี role = admin ทั้งหมด (ไม่ต้องยืนยันตัวตน)
 *     description: คืนค่ารายชื่อผู้ใช้ทั้งหมดที่มี role = "admin" โดยไม่ต้องส่ง JWT
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AdminUser'
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/**
 * @swagger
 * tags:
 *   - name: AdminUser
 *     description: จัดการข้อมูลผู้ใช้ (สำหรับ admin / system_manager)
 *
 * components:
 *   schemas:
 *     AdminUser:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         role:
 *           type: string
 *           example: "user"
 *
 *     AdminUserCreateRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *         - email
 *         - phone
 *       properties:
 *         username:
 *           type: string
 *           example: "admintest"
 *         password:
 *           type: string
 *           minLength: 8
 *           example: "password"
 *         email:
 *           type: string
 *           format: email
 *           example: "admin@test.com"
 *         phone:
 *           type: string
 *           example: "000-000-0000"
 *         role:
 *           type: string
 *           example: "admin"
 *
 *     AdminUserUpdateRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           example: "admintest2"
 *         email:
 *           type: string
 *           format: email
 *           example: "admin2@test.com"
 *         phone:
 *           type: string
 *           example: "111-000-0000"
 *         role:
 *           type: string
 *           example: "admin"
 */

/**
 * @swagger
 * /api/v1/admin/users:
 *   post:
 *     tags: [AdminUser]
 *     summary: สร้างผู้ใช้ใหม่ (เฉพาะ system_manager สร้าง admin ได้)
 *     description: |
 *       - system_manager: สร้างได้เฉพาะผู้ใช้ role = "admin" เท่านั้น
 *       - admin: ไม่สามารถสร้างผู้ใช้ได้เลย
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserCreateRequest'
 *     responses:
 *       201:
 *         description: สร้างผู้ใช้สำเร็จ
 *       400:
 *         description: ข้อมูลไม่ครบ / password สั้นเกินไป / role ไม่ใช่ admin
 *       403:
 *         description: ไม่มีสิทธิ์สร้างผู้ใช้
 *       409:
 *         description: username หรือ email ซ้ำ
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/**
 * @swagger
 * /api/v1/admin/users/{user_id}:
 *   put:
 *     tags: [AdminUser]
 *     summary: แก้ไขข้อมูลผู้ใช้ (admin / system_manager)
 *     description: |
 *       Rule การใช้งาน:
 *       - system_manager: แก้ไขข้อมูลได้ทุกคน ทุก role
 *       - admin: แก้ไขได้เฉพาะ user ปกติเท่านั้น
 *       - admin ห้ามเปลี่ยน role ใครให้เป็น admin หรือ system_manager
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสผู้ใช้ที่ต้องการแก้ไข
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserUpdateRequest'
 *     responses:
 *       200:
 *         description: แก้ไขสำเร็จ
 *       400:
 *         description: ไม่มีข้อมูลที่จะอัปเดต
 *       403:
 *         description: ไม่มีสิทธิ์แก้ไข user นี้
 *       404:
 *         description: ไม่พบ user
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */

/**
 * @swagger
 * /api/v1/admin/users/{user_id}:
 *   delete:
 *     tags: [AdminUser]
 *     summary: ลบผู้ใช้ (admin / system_manager)
 *     description: |
 *       - system_manager: ลบได้ทุก role
 *       - admin: ลบได้เฉพาะ user ปกติเท่านั้น (ห้ามลบ admin และ system_manager)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: รหัสผู้ใช้ที่ต้องการลบ
 *     responses:
 *       200:
 *         description: ลบสำเร็จ
 *       403:
 *         description: ไม่มีสิทธิ์ลบ user นี้
 *       404:
 *         description: ไม่พบ user
 *       500:
 *         description: ข้อผิดพลาดภายในเซิร์ฟเวอร์
 */



/**
 * ดึงข้อมูลผู้ใช้ที่มี role = admin ทั้งหมด
 */
router.get("/admins", async (req, res) => {
  const sql = `
    SELECT user_id, username, email, phone, role
    FROM User
    WHERE role = 'admin'
  `;

  try {
    const [rows] = await db.query(sql);
    return res.json(rows || []);
  } catch (err) {
    console.error("Error fetching admins:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Middleware สำหรับเช็คสิทธิ์ด้านล่าง
router.use(authRequired);

function isSystemManager(req) {
  return req.user && req.user.role === "system_manager";
}

function isAdmin(req) {
  return req.user && req.user.role === "admin";
}

// ======================= 1) สร้างผู้ใช้ใหม่ =======================
router.post("/users", async (req, res) => {
  try {
    const { username, password, email, phone, role } = req.body;

    if (!isSystemManager(req)) {
      return res.status(403).json({ error: "เฉพาะ system_manager เท่านั้นที่สามารถสร้างผู้ใช้ได้" });
    }

    if (!username || !password || !email || !phone) {
      return res.status(400).json({ error: "ต้องกรอกข้อมูลให้ครบ" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "password ต้องยาวอย่างน้อย 8 ตัวอักษร" });
    }

    if (role && role !== "admin") {
      return res.status(400).json({ error: 'system_manager สร้างได้เฉพาะ role = "admin" เท่านั้น' });
    }
    const newRole = "admin";

    // เช็คซ้ำ
    const checkSql = `SELECT user_id FROM User WHERE username = ? OR email = ? LIMIT 1`;
    const [existing] = await db.query(checkSql, [username, email]);

    if (existing.length > 0) {
      return res.status(409).json({ error: "username หรือ email ถูกใช้แล้ว" });
    }

    const hashed = await bcrypt.hash(password, 12);
    const insertSql = `
      INSERT INTO User (username, password, email, phone, role)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.query(insertSql, [username, hashed, email, phone, newRole]);

    return res.status(201).json({
      message: "สร้างผู้ใช้สำเร็จ",
      user: {
        user_id: result.insertId,
        username,
        email,
        phone,
        role: newRole,
      },
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ======================= 2) แก้ไขข้อมูลผู้ใช้ =======================
router.put("/users/:user_id", async (req, res) => {
  const targetId = req.params.user_id;
  const { username, email, phone, role } = req.body;

  try {
    const findSql = `SELECT user_id, username, email, phone, role FROM User WHERE user_id = ?`;
    const [rows] = await db.query(findSql, [targetId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ต้องการแก้ไข" });
    }
    const existingUser = rows[0];
    const targetRole = existingUser.role;

    if (isAdmin(req) && ["admin", "system_manager"].includes(targetRole)) {
      return res.status(403).json({ error: "admin แก้ไขข้อมูลของ admin หรือ system_manager ไม่ได้" });
    }
    if (isAdmin(req) && role && ["admin", "system_manager"].includes(role)) {
      return res.status(403).json({ error: "admin เปลี่ยน role เป็น admin/system_manager ไม่ได้" });
    }

    const fields = [];
    const values = [];

    if (username) { fields.push("username = ?"); values.push(username); }
    if (email) { fields.push("email = ?"); values.push(email); }
    if (phone) { fields.push("phone = ?"); values.push(phone); }
    if (role) { fields.push("role = ?"); values.push(role); }

    if (fields.length === 0) {
      return res.status(400).json({ error: "ไม่มีข้อมูลที่ต้องการแก้ไข" });
    }

    values.push(targetId);
    const updateSql = `UPDATE User SET ${fields.join(", ")} WHERE user_id = ?`;
    await db.query(updateSql, values);

    // Return updated data
    const [updatedRows] = await db.query(
      `SELECT user_id, username, email, phone, role FROM User WHERE user_id = ?`,
      [targetId]
    );

    return res.json({
      message: "แก้ไขข้อมูลสำเร็จ",
      user: updatedRows[0],
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ======================= 3) ลบผู้ใช้ =======================
router.delete("/users/:user_id", async (req, res) => {
  const targetId = req.params.user_id;

  try {
    const findSql = `SELECT user_id, role FROM User WHERE user_id = ?`;
    const [rows] = await db.query(findSql, [targetId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้ที่ต้องการลบ" });
    }
    const targetRole = rows[0].role;

    if (isAdmin(req) && ["admin", "system_manager"].includes(targetRole)) {
      return res.status(403).json({ error: "admin ไม่สามารถลบ admin หรือ system_manager ได้" });
    }

    const deleteSql = `DELETE FROM User WHERE user_id = ?`;
    const [result] = await db.query(deleteSql, [targetId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "ไม่สามารถลบข้อมูลได้" });
    }

    return res.json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;