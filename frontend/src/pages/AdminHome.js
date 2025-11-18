// src/pages/AdminHome.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

import "./AdminHome.css";
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

    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const res = await axios.get(url, { headers });

    if (!res.data) {
      setSearchError("ไม่พบข้อมูลพัสดุที่ค้นหา");
    } else {
      setSearchResult(res.data);
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

        {/* SEARCH BOX */}
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

        {searchResult && (
          <div className="search-result-box">
            <h3>ผลการค้นหา</h3>

            <div className="result-row">
              {searchResult.package_img && (
                <img
                  src={searchResult.package_img}
                  alt="package"
                  className="result-image"
                />
              )}

              <div>
                <p>
                  <b>Package ID:</b> {searchResult.package_id}
                </p>
                <p>ชื่อผู้ส่ง: {searchResult.sender_name}</p>
                <p>เบอร์ผู้ส่ง: {searchResult.sender_tel}</p>
                <p>ชื่อผู้รับ: {searchResult.receiver_name}</p>
                <p>เบอร์ผู้รับ: {searchResult.receiver_tel}</p>
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
                          : "status-badge"
                      }
                    >
                      {pkg.status}
                    </td>
                    <td>
                      {/* ปุ่มแก้ไข เฉย ๆ ยังไม่ต้องทำงาน */}
                      <button
                        type="button"
                        className="edit-btn"
                        title="แก้ไขข้อมูลพัสดุ"
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
