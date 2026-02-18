const express = require("express");
const router = express.Router();
const db = require("../db");


// =============================
// สรุปจำนวนตามภาค
// =============================
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
