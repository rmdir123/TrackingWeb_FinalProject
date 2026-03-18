const express = require("express");
const axios = require("axios");
const router = express.Router();

// รับค่า RFID จาก Arduino
router.post("/rfid", async (req, res) => {
  const { epc } = req.body;

  if (!epc) {
    return res.status(400).json({ error: "RFID EPC required" });
  }

  try {

    // ส่งค่าไป Python API
    await axios.post("http://localhost:8000/rfid", {
      epc: epc
    });

    res.json({
      message: "RFID received and forwarded to Python",
      epc: epc
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to forward RFID" });
  }
});

module.exports = router;