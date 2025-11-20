// frontend/src/pages/PackageDetail.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import bg from "../images/bg.png";
import "./PackageDetail.css";

const PACKAGE_URL = "http://localhost:5000/api/v1/packages";

function formatDateTime(str) {
  if (!str) return "-";
  const [date, time] = str.split(" "); // "2024-10-19 19:00:00"
  if (!time) return str;
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y} ${time.slice(0, 5)}`; // 19-10-2024 19:00
}

function PackageDetail() {
  const { id } = useParams(); // /package/:id/detail
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
      <div
        className="detail-app"
        style={{ "--bg-image": `url(${bg})` }}
      >
        <Navbar />
        <div className="detail-wrapper">
          <p className="detail-loading">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error || !pkg) {
    return (
      <div
        className="detail-app"
        style={{ "--bg-image": `url(${bg})` }}
      >
        <Navbar />
        <div className="detail-wrapper">
          <div className="detail-card-shell">
            <button
              className="detail-back-btn"
              onClick={() => navigate(-1)}
            >
              ←
            </button>
            <div className="detail-card">
              <p className="detail-error">
                {error || "ไม่พบข้อมูลพัสดุ"}
              </p>
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
    fragile,
    ocr_result,
    created_time,
    updated_time,
    height,
    width,
    package_img,
  } = pkg;

  const imgSrc =
    package_img || pkg.package_img || "/default-package.jpg";

  return (
    <div
      className="detail-app"
      style={{ "--bg-image": `url(${bg})` }}
    >
      <Navbar />

      <div className="detail-wrapper">
        <div className="detail-card-shell">
          {/* ปุ่มย้อนกลับ ด้านบนซ้ายของการ์ด */}
          <button
            className="detail-back-btn"
            onClick={() => navigate(-1)}
          >
            ←
          </button>

          <div className="detail-card">
            <div className="detail-top-row">
              {/* ซ้าย: รูป + Package ID */}
              <div className="detail-left">
                <div className="detail-img-frame">
                  <img
                    src={imgSrc}
                    alt={`Package ${package_id}`}
                    className="detail-img"
                  />
                </div>
                <div className="detail-package-id">
                  Package ID : {package_id}
                </div>
              </div>

              {/* กลาง: สถานะ + รายละเอียดที่อยู่ + OCR */}
              <div className="detail-right">
                {/* สถานะ */}
                <div className="detail-status-row">
                  <span className="detail-status-label">
                    สถานะปัจจุบัน :
                  </span>
                  <span className="detail-status-value">
                    {status}
                  </span>
                  <span className="detail-status-dot" />
                </div>

                {/* ที่อยู่ / ผู้ส่ง-ผู้รับ */}
                <div className="detail-section">
                  <div className="detail-section-title">
                    รายละเอียดที่อยู่ผู้รับ-ผู้ส่ง
                  </div>

                  <div className="detail-subtitle">ผู้ส่ง :</div>
                  <div>{sender_name}</div>
                  <div>เบอร์โทรศัพท์ผู้ส่ง : {sender_tel}</div>

                  <div className="detail-subtitle">ผู้รับ :</div>
                  <div>{receiver_name}</div>
                  <div>
                    ที่อยู่ผู้รับ : {address} {province}
                  </div>
                  <div>รหัสไปรษณีย์ : {post_code}</div>
                  <div>เบอร์โทรศัพท์ผู้รับ : {receiver_tel}</div>
                </div>

                {/* ผล OCR (ตัวอักษรเปล่า ๆ) */}
                <div className="detail-section">
                  <div className="detail-section-title">
                    ผลการ OCR ตรวจจับตัวอักษร
                  </div>
                  <pre className="detail-ocr-text">
                    {ocr_result || "-"}
                  </pre>
                </div>
              </div>

              {/* ขวาสุด: ข้อมูลทางกายภาพ */}
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
                  <span>ความสูง :</span>
                  <span>{height ? `${height} cm` : "-"}</span>
                </div>

                <div className="detail-meta-row">
                  <span>ชนิดวัสดุ :</span>
                  <span>{material_type || "-"}</span>
                </div>

                <div className="detail-meta-row">
                  <span>พัสดุมีความเปราะบาง :</span>
                  <span>{fragile ? "ใช่" : "ไม่"}</span>
                </div>
              </div>
            </div>

            {/* ❌ เอาปุ่มด้านล่างออกแล้ว ตามที่ขอ */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageDetail;
