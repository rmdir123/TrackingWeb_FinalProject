const express = require("express");
const router = express.Router();
const db = require("../db");

/**
 * @swagger
 * tags:
 *   - name: PackageDashboard
 *     description: สรุปข้อมูลแพ็กเกจสำหรับ Dashboard
 *
 * components:
 *   schemas:
 *     RegionSummary:
 *       type: object
 *       properties:
 *         region:
 *           type: string
 *           example: "ภาคกลาง"
 *         total:
 *           type: integer
 *           example: 120
 *
 *     StatusSummary:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: "delivered"
 *         total:
 *           type: integer
 *           example: 85
 *
 *     DashboardErrorResponse::
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Database error"
 */

// =============================
// สรุปจำนวนตามภาค
// =============================

/**
 * @swagger
 * /api/v1/dashboard/region-summary:
 *   get:
 *     tags: [PackageDashboard]
 *     summary: สรุปจำนวนแพ็กเกจตามภาค
 *     description: ดึงข้อมูลจำนวนแพ็กเกจทั้งหมด จัดกลุ่มตามภาคของจังหวัด
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RegionSummary'
 *             example:
 *               - region: "ภาคกลาง"
 *                 total: 120
 *               - region: "ภาคเหนือ"
 *                 total: 85
 *               - region: "ระบุไม่ได้"
 *                 total: 10
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardErrorResponse:'
 */
router.get("/region-summary", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
          COALESCE(p.region, 'ระบุไม่ได้') AS region,
          COUNT(*) AS total
      FROM Package t
      LEFT JOIN Provinces p 
          ON TRIM(t.province) = p.province_name
      GROUP BY region
      ORDER BY total DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =============================
// สรุปจำนวนตามสถานะ
// =============================

/**
 * @swagger
 * /api/v1/dashboard/status-summary:
 *   get:
 *     tags: [PackageDashboard]
 *     summary: สรุปจำนวนแพ็กเกจตามสถานะ
 *     description: ดึงข้อมูลจำนวนแพ็กเกจทั้งหมด จัดกลุ่มตามสถานะ
 *     responses:
 *       200:
 *         description: สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StatusSummary'
 *             example:
 *               - status: "delivered"
 *                 total: 200
 *               - status: "pending"
 *                 total: 50
 *       500:
 *         description: เซิร์ฟเวอร์ผิดพลาด
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardErrorResponse:'
 */
router.get("/status-summary", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT status, COUNT(*) as total
      FROM Package
      GROUP BY status
      ORDER BY total DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
