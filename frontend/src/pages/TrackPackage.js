// frontend/src/pages/TrackPackage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./TrackPackage.css";
import "./AdminHome.css"; // ⭐ เอา style search-box ของ admin มาใช้ร่วมกัน
import { useParams, useNavigate } from "react-router-dom";

import imgNotFound from "../images/notfound.png";
import Navbar from "../components/Navbar";
import bg from "../images/bg.png";

function TrackPackage() {
  const { id } = useParams(); // รับค่า ID จาก URL เช่น /track/101
  const [trackingId, setTrackingId] = useState(id || "");
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // ยิงค้นหาอัตโนมัติเมื่อมี id จาก URL
  useEffect(() => {
    if (id) {
      setTrackingId(id);
      handleSearch(id);
    }
  }, [id]);

  // ฟังก์ชันค้นหา
  const handleSearch = async (value) => {
    const searchId = (value || trackingId).trim();
    if (!searchId) return;

    setLoading(true);
    setError("");
    setPkg(null);

    try {
      // 1. เช็คว่ามีการ Login ไหม (ดึง token)
      const token = localStorage.getItem("token");

      // 2. เลือก URL และ Config ตามสถานะการ Login
      const url = token
        ? `http://43.209.65.64:5000/api/v1/secure/packages/${searchId}` // มี Token ใช้ Secure
        : `http://43.209.65.64:5000/api/v1/packages/${searchId}`; // ไม่มีใช้ Public

      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};

      // 3. ยิง Axios ด้วย URL และ Config ที่เลือก
      const res = await axios.get(url, config);

      const data = res.data.data || res.data;
      setPkg(data);
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        setError("เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      } else {
        setError("ไม่พบหมายเลขพัสดุนี้ในระบบ");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setPkg(null);
    setError("");
  };

  return (
    <div
      className="track-app"
      style={{
        "--bg-image": "url('/images/bg.png')",
      }}
    >
      {/* NAVBAR */}
      <Navbar />

      <div className="trackpage-wrapper">
        {/* 🔍 ใช้ search box แบบเดียวกับ AdminHome */}
        <form className="search-box-wrapper" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            className="search-box"
            placeholder="กรอกหมายเลขพัสดุ เช่น 101 แล้วกด Enter"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />
        </form>

        {/* ถ้า error (ไม่พบพัสดุ) */}
        {error && (
          <div className="trackpage-result-shell">
            <button className="trackpage-back-btn" onClick={handleBack}>
              ←
            </button>

            <div className="trackpage-notfound-box">
              <img
                src={imgNotFound}
                alt="not found"
                className="trackpage-notfound-img"
              />
              <p className="trackpage-notfound-text">ไม่พบพัสดุของคุณ</p>
            </div>
          </div>
        )}

        {/* กล่องผลลัพธ์ (การ์ดใหญ่) */}
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
                <div className="trackpage-status-row">
                  <span className="trackpage-status-label">
                    สถานะปัจจุบัน :
                  </span>

                  <span className="trackpage-status-value">
                    {pkg.current_status || pkg.status}
                  </span>

                  <span className="trackpage-status-dot" />

                  <span className="trackpage-status-note">
                    {pkg.status_note}
                  </span>
                </div>

                {/* ผู้ส่ง */}
                <div className="trackpage-section">
                  <div className="trackpage-section-title">ผู้ส่ง :</div>
                  <div>{pkg.sender_name}</div>
                  <div>เบอร์โทรศัพท์ผู้ส่ง : {pkg.sender_tel}</div>
                </div>

                {/* ผู้รับ */}
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
                    onClick={() =>
                      navigate(`/package/${pkg.package_id}/detail`)
                    }
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
