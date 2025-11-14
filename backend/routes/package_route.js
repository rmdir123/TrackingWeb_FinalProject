// routes/package_route.js
const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const router = express.Router();

/* ==============================
   Auth middleware (Bearer JWT)
   ============================== */
function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    // payload ควรมี user_id และ role
    req.user = { user_id: payload.user_id, role: payload.role };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ตรวจสิทธิ์ role แบบง่าย
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (req.user.role !== role) {
      return res.status(403).json({ error: `ต้องเป็นผู้ใช้ระดับ ${role} เท่านั้น` });
    }
    next();
  };
}

/* ==============================
   Helpers: type safety เบาๆ
   ============================== */
function n(v) {
  if (v === undefined || v === null || v === '') return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}
function s(v) {
  if (v === undefined || v === null || v === '') return null;
  return String(v);
}

/**
 * @swagger
 * tags:
 *   - name: Package
 *     description: จัดการข้อมูลเกี่ยวกับพัสดุ
 *
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     Package:
 *       type: object
 *       properties:
 *         package_id:
 *           type: integer
 *           example: 101
 *         height:
 *           type: number
 *           nullable: true
 *           example: 12
 *         width:
 *           type: number
 *           nullable: true
 *           example: 25
 *         sender_name:
 *           type: string
 *           nullable: true
 *           example: "สมชาย"
 *         receiver_name:
 *           type: string
 *           nullable: true
 *           example: "สมหญิง"
 *         sender_tel:
 *           type: string
 *           nullable: true
 *           example: "0812345678"
 *         receiver_tel:
 *           type: string
 *           nullable: true
 *           example: "0898765432"
 *         address:
 *           type: string
 *           nullable: true
 *           example: "99/9 ถ.งามวงศ์วาน ต.บางเขน อ.เมือง จ.นนทบุรี 11000"
 *         status:
 *           type: string
 *           nullable: true
 *           example: "pending"
 *         material_type:
 *           type: string
 *           nullable: true
 *           example: "cardboard"
 *         province:
 *           type: string
 *           nullable: true
 *           example: "นนทบุรี"
 *         post_code:
 *           type: string
 *           nullable: true
 *           example: "11000"
 *         fragile:
 *           type: integer
 *           enum:
 *             - 0
 *             - 1
 *           example: 0
 *         ocr_result:
 *           type: string
 *           nullable: true
 *           example: "คุณสมหญิง 11000"
 *         created_time:
 *           type: string
 *           format: date-time
 *           example: "2025-10-27T12:34:56.000Z"
 *         updated_time:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: "2025-10-27T12:34:56.000Z"
 *         package_img:
 *           type: string
 *           nullable: true
 *           example: "https://cdn.example.com/img/abc.jpg"
 *         modify_by:
 *           type: integer
 *           nullable: true
 *           example: 1
 *
 *     AddPackageRequest:
 *       type: object
 *       properties:
 *         height:
 *           type: number
 *           example: 12
 *         width:
 *           type: number
 *           example: 25
 *         sender_name:
 *           type: string
 *           example: "สมชาย"
 *         receiver_name:
 *           type: string
 *           example: "สมหญิง"
 *         sender_tel:
 *           type: string
 *           example: "0812345678"
 *         receiver_tel:
 *           type: string
 *           example: "0898765432"
 *         address:
 *           type: string
 *           example: "99/9 ถ.งามวงศ์วาน ต.บางเขน อ.เมือง จ.นนทบุรี 11000"
 *         status:
 *           type: string
 *           example: "pending"
 *         material_type:
 *           type: string
 *           example: "cardboard"
 *         province:
 *           type: string
 *           example: "นนทบุรี"
 *         post_code:
 *           type: string
 *           example: "11000"
 *         ocr_result:
 *           type: string
 *           example: "คุณสมหญิง 11000"
 *         package_img:
 *           type: string
 *           example: "https://cdn.example.com/img/abc.jpg"
 *         modify_by:
 *           type: integer
 *           nullable: true
 *           example: 1
 *
 *     PackageResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Package added successfully"
 *         data:
 *           $ref: '#/components/schemas/Package'
 *
 *     PackageListResponse:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 135
 *         limit:
 *           type: integer
 *           example: 50
 *         offset:
 *           type: integer
 *           example: 0
 *         order:
 *           type: string
 *           example: "desc"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Package'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Invalid id"
 */


/**
 * @swagger
 * /api/v1/addpackage:
 *   post:
 *     tags: [Package]
 *     summary: เพิ่มพัสดุใหม่ (เพิ่มอัตโนมัติโดยข้อมูลจาก AI)
 *     description: เพิ่มรายการพัสดุใหม่เข้าในระบบ (fragile จะถูกตั้งค่าเริ่มต้นเป็น 0 และระบบจะบันทึก created_time / updated_time ให้อัตโนมัติ)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddPackageRequest'
 *           examples:
 *             default:
 *               value:
 *                 height: 12
 *                 width: 25
 *                 sender_name: "สมชาย"
 *                 receiver_name: "สมหญิง"
 *                 sender_tel: "0812345678"
 *                 receiver_tel: "0898765432"
 *                 address: "99/9 ถ.งามวงศ์วาน ต.บางเขน อ.เมือง จ.นนทบุรี 11000"
 *                 status: "pending"
 *                 material_type: "cardboard"
 *                 province: "นนทบุรี"
 *                 post_code: "11000"
 *                 ocr_result: "คุณสมหญิง 11000"
 *                 package_img: "https://cdn.example.com/img/abc.jpg"
 *                 modify_by: 1
 *     responses:
 *       201:
 *         description: เพิ่มพัสดุสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageResponse'
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/addpackage', (req, res) => {
  const {
    height,
    width,
    sender_name,
    receiver_name,
    sender_tel,
    receiver_tel,
    address,
    status,
    material_type,
    province,
    post_code,
    ocr_result,
    package_img,
    modify_by
  } = req.body || {};

  const now = new Date().toISOString();

  const sql = `
    INSERT INTO Package (
      height, width, sender_name, receiver_name, sender_tel, receiver_tel,
      address, status, material_type, province, post_code,
      fragile, ocr_result, created_time, updated_time, package_img, modify_by
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?, 0, ?, ?, ?, ?, ?)
  `;

  const params = [
    n(height), n(width), s(sender_name), s(receiver_name), s(sender_tel), s(receiver_tel),
    s(address), s(status), s(material_type), s(province), s(post_code),
    s(ocr_result), now, now, s(package_img), (modify_by ?? null)
  ];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });

    const newId = this.lastID;
    const selectSql = `
      SELECT package_id, height, width, sender_name, receiver_name,
             sender_tel, receiver_tel, address, status, material_type,
             province, post_code, fragile, ocr_result,
             created_time, updated_time, package_img, modify_by
      FROM Package
      WHERE package_id = ?
    `;
    db.get(selectSql, [newId], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json({ message: 'Package added successfully', data: row });
    });
  });
});

/**
 * @swagger
 * /api/v1/packages:
 *   get:
 *     tags: [Package]
 *     summary: รายการพัสดุ (ยังไม่ได้แก้ให้ใช้ได้แค่ admin)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 200, default: 50 }
 *         description: กำหนดจำนวนรายการข้อมูลต่อหน้า (สูงสุด 200)
 *       - in: query
 *         name: offset
 *         schema: { type: integer, minimum: 0, default: 0 }
 *         description: ตำแหน่งเริ่มดึงข้อมูล
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: เรียงตามเวลา `created_time`
 *     responses:
 *       200:
 *         description: ดึงรายการสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageListResponse'
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/packages', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = parseInt(req.query.offset || '0', 10);
  const order = (req.query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const sql = `
    SELECT package_id, height, width, sender_name, receiver_name,
           sender_tel, receiver_tel, address, status, material_type,
           province, post_code, fragile, ocr_result,
           created_time, updated_time, package_img, modify_by
    FROM Package
    ORDER BY datetime(created_time) ${order}
    LIMIT ? OFFSET ?
  `;

  db.all(sql, [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    db.get(`SELECT COUNT(*) AS total FROM Package`, [], (err2, countRow) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({
        total: countRow?.total ?? rows.length,
        limit,
        offset,
        order: order.toLowerCase(),
        data: rows
      });
    });
  });
});


/**
 * @swagger
 * /api/v1/package/ocrfail:
 *   get:
 *     summary: ดึงรายการพัสดุที่เคยมีปัญหา OCR (OCR_Fail / OCR_Update)
 *     description: >
 *       คืนค่ารายการพัสดุที่สถานะปัจจุบันเป็น `OCR_Fail` หรือ `OCR_Update`  
 *       โดยใช้สำหรับดูพัสดุที่เคย OCR ไม่ผ่าน และพัสดุที่ถูกแก้ไข OCR แล้ว
 *     tags:
 *       - Package
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 200
 *         description: จำนวนเรคคอร์ดสูงสุดที่ต้องการในหนึ่งครั้ง
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: จำนวนเรคคอร์ดที่ข้ามไป (ใช้สำหรับ pagination)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: รูปแบบการเรียงตามเวลา `created_time` (asc = เก่าก่อน, desc = ใหม่ก่อน)
 *     responses:
 *       200:
 *         description: รายการพัสดุที่เคยมีปัญหา OCR
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: จำนวนพัสดุทั้งหมดที่ status เป็น OCR_Fail หรือ OCR_Update
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *                 order:
 *                   type: string
 *                   example: desc
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Package'
 *       400:
 *         description: ค่าพารามิเตอร์ไม่ถูกต้อง
 *       500:
 *         description: มีข้อผิดพลาดจากฝั่งเซิร์ฟเวอร์
 */
router.get('/package/ocrfail', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  const offset = parseInt(req.query.offset || '0', 10);
  const order = (req.query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const sql = `
    SELECT package_id, height, width, sender_name, receiver_name,
           sender_tel, receiver_tel, address, status, material_type,
           province, post_code, fragile, ocr_result,
           created_time, updated_time, package_img, modify_by
    FROM Package
    WHERE status IN ('OCR_Fail', 'OCR_Update')
    ORDER BY datetime(created_time) ${order}
    LIMIT ? OFFSET ?
  `;

  db.all(sql, [limit, offset], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const countSql = `
      SELECT COUNT(*) AS total
      FROM Package
      WHERE status IN ('OCR_Fail', 'OCR_Update')
    `;

    db.get(countSql, [], (err2, countRow) => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }

      res.json({
        total: countRow?.total ?? rows.length,
        limit,
        offset,
        order: order.toLowerCase(),
        data: rows
      });
    });
  });
});



/**
 * @swagger
 * /api/v1/packages/edited:
 *   get:
 *     tags: [Package]
 *     summary: (system manager) ดึงพัสดุทั้งหมดที่ถูกแก้ไข (modify_by != null)
 *     description: การดูพัสดุที่ถูกแก้ไขโดย admin ต้องเข้าสู่ระบบและมีสิทธิ์เป็น system manager
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: สำเร็จ — รายการพัสดุที่ถูกแก้ไข
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Package'
 *       401:
 *         description: ไม่ได้ยืนยันตัวตน
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       403:
 *         description: ไม่มีสิทธิ์ (ต้องเป็น system manager)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get(
  '/packages/edited',
  authRequired,
  requireRole('system_manager'),
  (req, res) => {
    const sql = `
      SELECT package_id, height, width, sender_name, receiver_name,
             sender_tel, receiver_tel, address, status, material_type,
             province, post_code, fragile, ocr_result,
             created_time, updated_time, package_img, modify_by
      FROM Package
      WHERE modify_by IS NOT NULL AND TRIM(CAST(modify_by AS TEXT)) <> ''
      ORDER BY datetime(COALESCE(updated_time, created_time)) DESC
    `;
    db.all(sql, [], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  }
);

/**
 * @swagger
 * /api/v1/packages/{id}:
 *   get:
 *     tags: [Package]
 *     summary: ดึงพัสดุแบบ ตามไอดี (ไม่ต้อง login)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: รหัสพัสดุ (package_id)
 *     responses:
 *       200:
 *         description: พบรายการ
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       400:
 *         description: ไอดีไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: ไม่พบรายการ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/packages/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const sql = `
    SELECT package_id, height, width, sender_name, receiver_name,
           sender_tel, receiver_tel, address, status, material_type,
           province, post_code, fragile, ocr_result,
           created_time, updated_time, package_img, modify_by
    FROM Package
    WHERE package_id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

/**
 * @swagger
 * /api/v1/secure/packages/{id}:
 *   get:
 *     tags: [Package]
 *     summary: (login user) ดึงข้อมูลพัสดุตาม ID + บันทึก History (ต้องส่ง Bearer JWT)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *         description: รหัสพัสดุ (package_id)
 *     responses:
 *       200:
 *         description: พบรายการและบันทึกประวัติสำเร็จ (หากบันทึกประวัติล้มเหลว ระบบยังคงส่งข้อมูลพัสดุ)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Package'
 *       400:
 *         description: ไอดีไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       401:
 *         description: ไม่ได้ส่ง token หรือ token ไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404:
 *         description: ไม่พบรายการ
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.get('/secure/packages/:id', authRequired, (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

  const sql = `
    SELECT package_id, height, width, sender_name, receiver_name,
           sender_tel, receiver_tel, address, status, material_type,
           province, post_code, fragile, ocr_result,
           created_time, updated_time, package_img, modify_by
    FROM Package
    WHERE package_id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });

    // บันทึกประวัติการค้นหา (History) — เฉพาะผู้ใช้ที่ล็อกอิน
    const insertHis = `INSERT INTO History (user_id, package_id) VALUES (?, ?)`;
    db.run(insertHis, [req.user.user_id, row.package_id], (e) => {
      if (e) console.error('History insert error:', e.message);
      res.json(row);
    });
  });
});



module.exports = router;
