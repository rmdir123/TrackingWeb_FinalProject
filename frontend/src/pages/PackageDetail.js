// frontend/src/pages/PackageDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import bg from "../images/bg.png";
import "./PackageDetail.css";

const PACKAGE_URL = "/api/v1/packages";

function formatDateTime(str) {
  if (!str) return "-";
  const [date, time] = str.split(" ");
  if (!time) return str;
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y} ${time.slice(0, 5)}`;
}

// ── สีสถานะ 3 ระดับ ──────────────────────────────────────────
const STATUS_FAIL_KEYWORDS    = ["fail", "ล้มเหลว", "ยกเลิก", "cancel", "error"];
const STATUS_SUCCESS_KEYWORDS = ["success", "สำเร็จ", "delivered", "complete", "จัดส่งแล้ว"];

function getStatusColor(status = "") {
  const s = status.toLowerCase();
  if (STATUS_FAIL_KEYWORDS.some((k)    => s.includes(k))) return "#e53e3e"; // 🔴 แดง
  if (STATUS_SUCCESS_KEYWORDS.some((k) => s.includes(k))) return "#38a169"; // 🟢 เขียว
  return "#d69e2e"; // 🟡 เหลือง (กำลังดำเนินการ)
}
// ─────────────────────────────────────────────────────────────

function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setError("");
        setLoading(true);
        const res = await axios.get(`${PACKAGE_URL}/${id}`);
        const data = res.data.data || res.data;
        setPkg(data);
      } catch (err) {
        console.error(err);
        setError("ไม่พบข้อมูลพัสดุ");
      } finally {
        setLoading(false);
      }
    };

    fetchPackage();
  }, [id]);

  if (loading) {
    return (
      <div className="detail-app" style={{ "--bg-image": "url('/images/bg.png')" }}>
        <Navbar />
        <div className="detail-wrapper">
          <p className="detail-loading">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div className="detail-app" style={{ "--bg-image": "url('/images/bg.png')" }}>
        <Navbar />
        <div className="detail-wrapper">
          <div className="detail-card-shell">
            <button className="detail-back-btn" onClick={() => navigate(-1)}>←</button>
            <div className="detail-card">
              <p className="detail-error">{error || "ไม่พบข้อมูลพัสดุ"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    package_id,
    status,
    sender_name,
    receiver_name,
    sender_tel,
    receiver_tel,
    address,
    province,
    post_code,
    material_type,
    ocr_result,
    created_time,
    updated_time,
    length,
    width,
    package_img,
    location,
    epc,
  } = pkg;

  const imgSrc   = package_img || "/default-package.jpg";
  const statusColor = getStatusColor(status); // ← สีตามสถานะ

  return (
    <div className="detail-app" style={{ "--bg-image": "url('/images/bg.png')" }}>
      <Navbar />

      <div className="detail-wrapper">
        <div className="detail-card-shell">
          <button className="detail-back-btn" onClick={() => navigate(-1)}>←</button>

          <div className="detail-card">
            <div className="detail-top-row">

              {/* ── ซ้าย: รูป + Package ID ── */}
              <div className="detail-left">
                <div className="detail-img-frame">
                  <img src={imgSrc} alt={`Package ${package_id}`} className="detail-img" />
                </div>
                <div className="detail-package-id">Package ID : {package_id}</div>
              </div>

              {/* ── กลาง: สถานะ + ที่อยู่ + OCR ── */}
              <div className="detail-right">

                {/* สถานะ พร้อมสี */}
                <div className="detail-status-row">
                  <span className="detail-status-label">สถานะปัจจุบัน :</span>
                  <span
                    className="detail-status-value"
                    style={{ color: statusColor, fontWeight: 600 }}
                  >
                    {status}
                  </span>
                  <span
                    className="detail-status-dot"
                    style={{ backgroundColor: statusColor }}
                  />
                </div>

                {/* ที่อยู่ผู้ส่ง-ผู้รับ */}
                <div className="detail-section">
                  <div className="detail-section-title">รายละเอียดที่อยู่ผู้รับ-ผู้ส่ง</div>

                  <div className="detail-subtitle">ผู้ส่ง :</div>
                  <div>{sender_name}</div>
                  <div>เบอร์โทรศัพท์ผู้ส่ง : {sender_tel}</div>

                  <div className="detail-subtitle">ผู้รับ :</div>
                  <div>{receiver_name}</div>
                  <div>ที่อยู่ผู้รับ : {address}</div>
                  <div>จังหวัด : {province}</div>
                  <div>รหัสไปรษณีย์ : {post_code}</div>
                  <div>เบอร์โทรศัพท์ผู้รับ : {receiver_tel}</div>
                </div>

                {/* ผล OCR */}
                <div className="detail-section">
                  <div className="detail-section-title">ผลการ OCR ตรวจจับตัวอักษร</div>
                  <pre className="detail-ocr-text">{ocr_result || "-"}</pre>
                </div>
              </div>

              {/* ── ขวา: ข้อมูลทางกายภาพ (ลบ fragile ออก) ── */}
              <div className="detail-meta">
                <div className="detail-meta-row">
                  <span>สร้างเมื่อ :</span>
                  <span>{formatDateTime(created_time)}</span>
                </div>
                <div className="detail-meta-row">
                  <span>อัปเดตล่าสุด :</span>
                  <span>{formatDateTime(updated_time)}</span>
                </div>
                <div className="detail-meta-row">
                  <span>ความกว้าง :</span>
                  <span>{width ? `${width} cm` : "-"}</span>
                </div>
                <div className="detail-meta-row">
                  <span>ความยาว :</span>
                  <span>{length ? `${length} cm` : "-"}</span>
                </div>
                <div className="detail-meta-row">
                  <span>ชนิดวัสดุ :</span>
                  <span>{material_type || "-"}</span>
                </div>
                {/* ลบแถว "พัสดุมีความเปราะบาง" ออกแล้ว */}
              </div>
            </div>

            <div>สถานที่ : {location || "-"}</div>
            <div>EPC : {epc || "-"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageDetail;
