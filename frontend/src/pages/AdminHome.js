// src/pages/AdminHome.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

import "./AdminHome.css";
import "./TrackPackage.css"; // ⭐ ดึง style การ์ดจาก TrackPackage มาใช้ซ้ำ
import bg from "../images/bg.png";
import weblogo from "../images/weblogo.png";

import Navbar from "../components/Navbar";

// ฟอร์แมตวันที่-เวลา
const formatDateTime = (dt) => {
  if (!dt) return "-";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt; // ถ้า parse ไม่ได้ก็แสดงค่าดิบไปเลย
  return d.toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

function AdminHome() {
  const navigate = useNavigate();

  const [packages, setPackages] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [ocrFailPackages, setOcrFailPackages] = useState([]);
  const [ocrFailError, setOcrFailError] = useState("");

  // ดึงรายการพัสดุทั้งหมด (โชว์ปกติ)
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/v1/packages")
      .then((res) => setPackages(res.data?.data || []))
      .catch((err) => console.error(err));
  }, []);

  // ดึงรายการพัสดุ OCR_Fail
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/v1/package/ocrfail")
      .then((res) => {
        setOcrFailPackages(res.data?.data || []);
      })
      .catch((err) => {
        console.error(err);
        setOcrFailError("โหลดข้อมูลพัสดุ OCR_Fail ไม่สำเร็จ");
      });
  }, []);

  // ไม่ให้หน้า scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev || "auto");
  }, []);

  // ค้นหา package ตาม ID
  const handleSearch = async (e) => {
    e.preventDefault();

    const id = searchId.trim();
    if (!id) return;

    try {
      setSearchError("");
      setSearchResult(null);

      // ดึง token จาก localStorage
      const token = localStorage.getItem("token");

      // ถ้ามี token → ใช้ /secure/... + ส่ง Authorization
      // ถ้าไม่มี token → ใช้ /packages/... ปกติ
      const url = token
        ? `http://localhost:5000/api/v1/secure/packages/${id}`
        : `http://localhost:5000/api/v1/packages/${id}`;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(url, { headers });
      const data = res.data?.data || res.data;

      if (!data) {
        setSearchError("ไม่พบข้อมูลพัสดุที่ค้นหา");
      } else {
        setSearchResult(data);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setSearchError("ไม่พบข้อมูลพัสดุที่ค้นหา");
      } else if (err.response?.status === 401) {
        setSearchError("ไม่มีสิทธิ์เข้าถึง (กรุณาเข้าสู่ระบบใหม่)");
      } else {
        setSearchError("ไม่พบข้อมูลพัสดุ หรือเกิดข้อผิดพลาด");
      }
    }
  };

  const clearSearchResult = () => {
    setSearchResult(null);
    setSearchError("");
  };

  return (
    <div
      className="app"
      style={{
        "--bg-image": `url(${bg})`,
      }}
    >
      {/* NAVBAR */}
      <Navbar />

      <main className="content">
        {/* SEARCH BOX (เหมือนเดิม) */}
        <form className="search-box-wrapper" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-box"
            placeholder="กรอก Package ID เพื่อค้นหา แล้วกด Enter"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </form>

        {/* RESULT ZONE */}
        {searchError && <p className="error-text">{searchError}</p>}

        {/* ⭐ แสดงผลลัพธ์แบบการ์ดเหมือนหน้า TrackPackage */}
        {searchResult && (
          <div className="trackpage-result-shell">
            <button className="trackpage-back-btn" onClick={clearSearchResult}>
              ←
            </button>

            <div className="trackpage-result-box">
              {/* ซ้าย: รูป + ID */}
              <div className="trackpage-left">
                <div className="trackpage-image-frame">
                  <img
                    className="trackpage-image"
                    src={
                      searchResult.package_img ||
                      searchResult.image_path ||
                      searchResult.image_url ||
                      "/default-package.jpg"
                    }
                    alt={`Package ${searchResult.package_id}`}
                  />
                </div>

                <div className="trackpage-package-id">
                  Package ID : {searchResult.package_id}
                </div>
              </div>

              {/* ขวา: รายละเอียด */}
              <div className="trackpage-right">
                <div className="trackpage-status-row">
                  <span className="trackpage-status-label">
                    สถานะปัจจุบัน :
                  </span>

                  <span className="trackpage-status-value">
                    {searchResult.current_status || searchResult.status}
                  </span>

                  <span className="trackpage-status-dot" />

                  <span className="trackpage-status-note">
                    {searchResult.status_note}
                  </span>
                </div>

                {/* ผู้ส่ง */}
                <div className="trackpage-section">
                  <div className="trackpage-section-title">ผู้ส่ง :</div>
                  <div>{searchResult.sender_name}</div>
                  <div>เบอร์โทรศัพท์ผู้ส่ง : {searchResult.sender_tel}</div>
                </div>

                {/* ผู้รับ */}
                <div className="trackpage-section">
                  <div className="trackpage-section-title">ผู้รับ :</div>
                  <div>{searchResult.receiver_name}</div>
                  <div>ที่อยู่ผู้รับ : {searchResult.address}</div>
                  <div>รหัสไปรษณีย์ : {searchResult.post_code}</div>
                  <div>เบอร์โทรศัพท์ผู้รับ : {searchResult.receiver_tel}</div>
                </div>

                <div className="trackpage-detail-row">
                  <button
                    className="trackpage-detail-btn"
                    onClick={() =>
                      navigate(`/package/${searchResult.package_id}/detail`)
                    }
                  >
                    รายละเอียดพัสดุ ⬇
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIST ปกติด้านล่าง */}
        <h2 className="subtitle">รายการพัสดุทั้งหมด</h2>
        <div className="packet-list-container">
          <ul className="packet-list">
            {packages.map((pkg) => (
              <li key={pkg.package_id} className="packet-item">
                <div className="left-box">
                  {pkg.package_img && (
                    <img
                      src={pkg.package_img}
                      alt="package"
                      className="package-image"
                    />
                  )}
                  <div className="package-id">ID: {pkg.package_id}</div>
                </div>

                <div className="right-box">
                  <div>ชื่อผู้ส่ง : {pkg.sender_name}</div>
                  <div>เบอร์ผู้ส่ง : {pkg.sender_tel}</div>
                  <div style={{ marginTop: 8 }}>
                    <div>ชื่อผู้รับ : {pkg.receiver_name}</div>
                    <div>เบอร์ผู้รับ : {pkg.receiver_tel}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ตาราง OCR Fail */}
        <section className="ocr-section">
          <h2 className="subtitle ocr-title">พัสดุที่มีปัญหา OCR</h2>

          {ocrFailError && <p className="error-text">{ocrFailError}</p>}

          <div className="ocr-table-wrapper">
            <table className="ocr-table">
              <thead>
                <tr>
                  <th>Package ID</th>
                  <th>ชื่อ-ผู้ส่ง</th>
                  <th>ชื่อ-ผู้รับ</th>
                  <th>วันเวลาที่สร้าง</th>
                  <th>สถานะปัจจุบัน</th>
                  <th>แก้ไข</th>
                </tr>
              </thead>
              <tbody className="ocr-table-body">
                {ocrFailPackages.map((pkg) => (
                  <tr key={pkg.package_id}>
                    <td>{pkg.package_id}</td>
                    <td>{pkg.sender_name}</td>
                    <td>{pkg.receiver_name}</td>
                    <td>{formatDateTime(pkg.created_time)}</td>
                    <td
                      className={
                        pkg.status === "OCR_Fail"
                          ? "status-badge status-fail"
                          : pkg.status === "OCR_Update"
                          ? "status-badge status-update"
                          : pkg.status === "Return_Package"
                          ? "status-badge status-return"
                          : "status-badge"
                      }
                    >
                      {pkg.status}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="edit-btn"
                        title="แก้ไขข้อมูลพัสดุ"
                        onClick={() =>
                          navigate(`/admin/package/${pkg.package_id}/edit`)
                        }
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}

                {ocrFailPackages.length === 0 && !ocrFailError && (
                  <tr>
                    <td colSpan={6} className="ocr-empty">
                      ตอนนี้ยังไม่มีพัสดุที่ OCR ล้มเหลว
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminHome;
