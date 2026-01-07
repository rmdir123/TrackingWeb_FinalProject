// routes/notification_route.js
const express = require("express");
const router = express.Router();
const db = require("../db");


/**
 * @swagger
 * tags:
 *   - name: Notification
 *     description: ระบบแจ้งเตือนเกี่ยวกับพัสดุ
 *
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         package_id:
 *           type: integer
 *           example: 25
 *         message:
 *           type: string
 *           example: "OCR อ่านพัสดุไม่สำเร็จ โปรดตรวจสอบ"
 *         status:
 *           type: string
 *           example: "UNREAD"
 *         created_at:
 *           type: string
 *           example: "2025-11-23 13:22:55"
 */

/**
 * @swagger
 * /api/v1/notifications/ocr-failure:
 *   post:
 *     tags: [Notification]
 *     summary: สร้างการแจ้งเตือนเมื่อพบว่า status = OCR_Fail
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [package_id]
 *             properties:
 *               package_id:
 *                 type: integer
 *                 example: 25
 *               message:
 *                 type: string
 *                 example: "OCR อ่านข้อมูลไม่สำเร็จ กรุณาตรวจสอบ"
 *     responses:
 *       201:
 *         description: สร้างการแจ้งเตือนสำเร็จ
 *       400:
 *         description: package_id ไม่ถูกต้อง หรือสถานะไม่ใช่ OCR_Fail
 *       404:
 *         description: ไม่พบพัสดุ
 */

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     tags: [Notification]
 *     summary: ดึงรายการแจ้งเตือน
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UNREAD, READ]
 *         description: กรองเฉพาะสถานะ
 *     responses:
 *       200:
 *         description: รายการแจ้งเตือนทั้งหมด
 */

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     tags: [Notification]
 *     summary: เปลี่ยนสถานะแจ้งเตือนเป็น READ
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: อัปเดตสำเร็จ
 *       404:
 *         description: ไม่พบแจ้งเตือน
 */


/* ==============================
   Create Notification Table (MySQL)
   ============================== */
const createTableSql = `
  CREATE TABLE IF NOT EXISTS Notification (
    id INT AUTO_INCREMENT PRIMARY KEY,
    package_id INT NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNREAD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (package_id) REFERENCES Package(package_id)
  );
`;

db.query(createTableSql)
  .then(() => console.log("✅ Notification table ready."))
  .catch((err) => console.error("❌ Error creating Notification table:", err.message));

// ======================= API START =========================

// สร้างการแจ้งเตือนเมื่อพบว่า status = OCR_Fail
router.post("/ocr-failure", async (req, res) => {
  const { package_id, message } = req.body;

  if (!package_id) {
    return res.status(400).json({ error: "ต้องระบุ package_id" });
  }

  try {
    const sqlCheck = `SELECT status FROM Package WHERE package_id = ?`;
    const [packages] = await db.query(sqlCheck, [package_id]);
    
    if (packages.length === 0) {
      return res.status(404).json({ error: "ไม่พบพัสดุ" });
    }
    const pkg = packages[0];

    if (pkg.status !== "OCR_Fail" && pkg.status !== "OCR_Failure") {
      return res.status(400).json({
        error: `status ปัจจุบันคือ '${pkg.status}' ไม่ใช่ OCR_Fail`,
      });
    }

    const msg = message || `พบปัญหาการอ่านข้อมูลพัสดุ (package_id=${package_id})`;

    const insertSql = `
      INSERT INTO Notification (package_id, message, status)
      VALUES (?, ?, 'UNREAD')
    `;
    const [result] = await db.query(insertSql, [package_id, msg]);

    res.status(201).json({
      message: "สร้างการแจ้งเตือนสำเร็จ",
      notification_id: result.insertId,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ดึงรายการแจ้งเตือน
router.get("/", async (req, res) => {
  const { status } = req.query;

  let sql = `
    SELECT n.id, n.package_id, n.message, n.status, n.created_at,
           p.status AS package_status, p.sender_name, p.receiver_name
    FROM Notification n
    LEFT JOIN Package p ON p.package_id = n.package_id
  `;

  const params = [];
  if (status) {
    sql += ` WHERE n.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY n.created_at DESC`;

  try {
    const [rows] = await db.query(sql, params);
    res.json({
      total: rows.length,
      data: rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// เปลี่ยนสถานะแจ้งเตือนเป็น READ
router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE Notification SET status = 'READ' WHERE id = ?`;

  try {
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "ไม่พบแจ้งเตือนนี้" });

    res.json({ message: "อัปเดตสถานะเป็น READ แล้ว" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;