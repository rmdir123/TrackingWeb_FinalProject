// frontend/src/pages/TrackPackage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TrackPackage.css";
import "./AdminHome.css";
import { useParams, useNavigate } from "react-router-dom";

import imgNotFound from "../images/notfound.png";
import Navbar from "../components/Navbar";

// ── สีสถานะ 3 ระดับ (เหมือน PackageDetail) ──────────────────
const STATUS_FAIL_KEYWORDS    = ["fail", "ล้มเหลว", "ยกเลิก", "cancel", "error"];
const STATUS_SUCCESS_KEYWORDS = ["success", "สำเร็จ", "delivered", "complete", "จัดส่งแล้ว"];

function getStatusColor(status = "") {
  const s = status.toLowerCase();
  if (STATUS_FAIL_KEYWORDS.some((k)    => s.includes(k))) return "#e53e3e"; // 🔴 แดง
  if (STATUS_SUCCESS_KEYWORDS.some((k) => s.includes(k))) return "#38a169"; // 🟢 เขียว
  return "#d69e2e"; // 🟡 เหลือง (กำลังดำเนินการ)
}
// ─────────────────────────────────────────────────────────────

function TrackPackage() {
  const { id } = useParams();
  const [trackingId, setTrackingId] = useState(id || "");
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      setTrackingId(id);
      handleSearch(id);
    }
  }, [id]);

  const handleSearch = async (value) => {
    const searchId = (value || trackingId).trim();
    if (!searchId) return;

    setLoading(true);
    setError("");
    setPkg(null);

    try {
      const token = localStorage.getItem("token");
      const url = token
        ? `/api/v1/secure/packages/${searchId}`
        : `/api/v1/packages/${searchId}`;
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      const res = await axios.get(url, config);
      const data = res.data.data || res.data;
      setPkg(data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      } else {
        setError("ไม่พบหมายเลขพัสดุนี้ในระบบ");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleBack = () => {
    setPkg(null);
    setError("");
  };

  return (
    <div className="track-app" style={{ "--bg-image": "url('/images/bg.png')" }}>
      <Navbar />

      <div className="trackpage-wrapper">
        <form className="search-box-wrapper" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="search-box"
            placeholder="กรอกหมายเลขพัสดุ เช่น 101 แล้วกด Enter"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />
        </form>

        {error && (
          <div className="trackpage-result-shell">
            <button className="trackpage-back-btn" onClick={handleBack}>←</button>
            <div className="trackpage-notfound-box">
              <img src={imgNotFound} alt="not found" className="trackpage-notfound-img" />
              <p className="trackpage-notfound-text">ไม่พบพัสดุของคุณ</p>
            </div>
          </div>
        )}

        {pkg && (() => {
          const statusColor = getStatusColor(pkg.current_status || pkg.status); // ← คำนวณสีครั้งเดียว
          return (
            <div className="trackpage-result-shell">
              <button className="trackpage-back-btn" onClick={handleBack}>←</button>

              <div className="trackpage-result-box">
                {/* ซ้าย: รูป */}
                <div className="trackpage-left">
                  <div className="trackpage-image-frame">
                    <img
                      className="trackpage-image"
                      src={
                        pkg.package_img ||
                        pkg.image_path ||
                        pkg.image_url ||
                        "/default-package.jpg"
                      }
                      alt={`Package ${pkg.package_id}`}
                    />
                  </div>
                  <div className="trackpage-package-id">
                    Package ID : {pkg.package_id}
                  </div>
                </div>

                {/* ขวา: รายละเอียด */}
                <div className="trackpage-right">

                  {/* สถานะ พร้อมสีจาก getStatusColor */}
                  <div className="trackpage-status-row">
                    <span className="trackpage-status-label">สถานะปัจจุบัน :</span>
                    <span
                      className="trackpage-status-value"
                      style={{ color: statusColor, fontWeight: 600 }}
                    >
                      {pkg.current_status || pkg.status}
                    </span>
                    <span
                      className="trackpage-status-dot"
                      style={{ backgroundColor: statusColor }}
                    />
                    <span className="trackpage-status-note">{pkg.status_note}</span>
                  </div>

                  {pkg.location && (
                    <div className="trackpage-section">
                      <div className="trackpage-section-title">สถานที่ล่าสุด :</div>
                      <div>{pkg.location}</div>
                    </div>
                  )}

                  <div className="trackpage-section">
                    <div className="trackpage-section-title">ผู้ส่ง :</div>
                    <div>{pkg.sender_name}</div>
                    <div>เบอร์โทรศัพท์ผู้ส่ง : {pkg.sender_tel}</div>
                  </div>

                  <div className="trackpage-section">
                    <div className="trackpage-section-title">ผู้รับ :</div>
                    <div>{pkg.receiver_name}</div>
                    <div>ที่อยู่ผู้รับ : {pkg.address}</div>
                    <div>รหัสไปรษณีย์ : {pkg.post_code}</div>
                    <div>เบอร์โทรศัพท์ผู้รับ : {pkg.receiver_tel}</div>
                  </div>

                  <div className="trackpage-detail-row">
                    <button
                      className="trackpage-detail-btn"
                      onClick={() => navigate(`/package/${pkg.package_id}/detail`)}
                    >
                      รายละเอียดพัสดุ ⬇
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {!pkg && !loading && !error && (
          <div className="trackpage-hint">
            ใส่หมายเลขพัสดุด้านบนเพื่อดูสถานะการจัดส่ง
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackPackage;
