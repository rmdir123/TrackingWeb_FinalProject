// frontend/src/pages/TrackPackage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TrackPackage.css";
import { useParams } from "react-router-dom";
import imgNotFound from "../images/notfound.png";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import bg from "../images/bg.png";


function TrackPackage() {
  const { id } = useParams();          // <-- รับค่า ID จาก URL เช่น /track/101
  const [trackingId, setTrackingId] = useState(id || "");
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // ⭐ ยิงค้นหาอัตโนมัติเมื่อมี id จาก URL
  useEffect(() => {
    if (id) {
      setTrackingId(id);
      handleSearch(id);
    }
  }, [id]);

  // ⭐ ฟังก์ชันค้นหา
  const handleSearch = async (value) => {
    const searchId = value || trackingId.trim();
    if (!searchId) return;

    setLoading(true);
    setError("");
    setPkg(null);

    try {
      const res = await axios.get(
        `http://localhost:5000/api/v1/packages/${searchId}`
      );

      const data = res.data.data || res.data;
      setPkg(data);
    } catch (err) {
      console.error(err);
      setError("ไม่พบพัสดุ หรือเซิร์ฟเวอร์มีปัญหา");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleBack = () => {
    setPkg(null);
    setError("");
  };

  return (
    <div
      className="track-app"
      style={{
        "--bg-image": `url(${bg})`,
      }}
    >
      {/* NAVBAR */}
      <Navbar />

      <div className="trackpage-wrapper">
        {/* กล่อง search */}
        <div className="trackpage-search-box">
          <input
            type="text"
            placeholder="กรอกหมายเลขพัสดุ เช่น 101"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="trackpage-search-btn"
            onClick={() => handleSearch()}
            disabled={loading}
          >
            🔍
          </button>
        </div>

        {/* error */}
        {/* ถ้า error (ไม่พบพัสดุ) */}
        {error && (
        <div className="trackpage-result-shell">
            <button className="trackpage-back-btn" onClick={handleBack}>←</button>

            <div className="trackpage-notfound-box">
            <img src={imgNotFound} alt="not found" className="trackpage-notfound-img" />

            <p className="trackpage-notfound-text">ไม่พบพัสดุของคุณ</p>
            </div>
        </div>
        )}

        {/* กล่องผลลัพธ์ */}
        {pkg && (
          <div className="trackpage-result-shell">
            <button className="trackpage-back-btn" onClick={handleBack}>
              ←
            </button>

            <div className="trackpage-result-box">
              {/* ซ้าย: รูป */}
              <div className="trackpage-left">
                <div className="trackpage-image-frame">
                  <img
                    className="trackpage-image"
                    src={
                      pkg.package_img ||        // <-- เอาจาก DB คอลัมน์ package_img
                      pkg.image_path ||
                      pkg.image_url ||
                      "/default-package.jpg"
                    }
                    alt={`Package ${pkg.package_id}`}
                  />
                </div>

                <div className="trackpage-package-id">
                  Package ID : {pkg.package_id }
                </div>
              </div>

              {/* ขวา */}
              <div className="trackpage-right">
                <div className="trackpage-status-row">
                  <span className="trackpage-status-label">
                    สถานะปัจจุบัน :
                  </span>

                  <span className="trackpage-status-value">
                    {pkg.current_status ||
                      pkg.status }
                  </span>

                  <span className="trackpage-status-dot" />

                  <span className="trackpage-status-note">
                    {pkg.status_note }
                  </span>
                </div>

                {/* ผู้ส่ง */}
                <div className="trackpage-section">
                  <div className="trackpage-section-title">ผู้ส่ง :</div>
                  <div>{pkg.sender_name }</div>
                  <div>
                    เบอร์โทรศัพท์ผู้ส่ง :{" "}
                    {pkg.sender_tel }
                  </div>
                </div>

                {/* ผู้รับ */}
                <div className="trackpage-section">
                  <div className="trackpage-section-title">ผู้รับ :</div>
                  <div>{pkg.receiver_name }</div>
                  <div>
                    ที่อยู่ผู้รับ :{" "}
                    {pkg.address 
                      }
                  </div>
                  <div>รหัสไปรษณีย์ : {pkg.post_code }</div>
                  <div>
                    เบอร์โทรศัพท์ผู้รับ :{" "}
                    {pkg.receiver_tel }
                  </div>
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
        )}

        {/* hint */}
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
