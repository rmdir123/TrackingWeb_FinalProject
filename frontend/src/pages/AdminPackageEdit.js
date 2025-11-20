// frontend/src/pages/AdminPackageEdit.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import bg from "../images/bg.png";
import "./AdminPackageEdit.css";

const PACKAGE_URL = "http://localhost:5000/api/v1/packages";

function formatDateTime(str) {
  if (!str) return "-";
  const [date, time] = str.split(" ");
  if (!time) return str;
  const [y, m, d] = date.split("-");
  return `${d}-${m}-${y} ${time.slice(0, 5)}`;
}

function AdminPackageEdit() {
  const { id } = useParams(); // /admin/package/:id/edit
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [form, setForm] = useState({
    sender_name: "",
    receiver_name: "",
    sender_tel: "",
    receiver_tel: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // โหลดข้อมูลพัสดุมาใส่ฟอร์ม
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await axios.get(`${PACKAGE_URL}/${id}`, { headers });
        const data = res.data.data || res.data;

        setPkg(data);
        setForm({
          sender_name: data.sender_name || "",
          receiver_name: data.receiver_name || "",
          sender_tel: data.sender_tel || "",
          receiver_tel: data.receiver_tel || "",
          address: data.address || "",
        });
      } catch (err) {
        console.error(err);
        setError("ไม่พบข้อมูลพัสดุ");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPackage();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const callUpdateApi = async (statusValue) => {
    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        alert("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      await axios.put(
        `${PACKAGE_URL}/${id}`,
        {
          ...form,
          status: statusValue, // OCR_Update หรือ Return_Package
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(
        statusValue === "Return_Package"
          ? "อัปเดตเป็น Return Package แล้ว"
          : "บันทึกข้อมูลสำเร็จ (OCR_Update)"
      );
      // โหลดข้อมูลใหม่หลังบันทึก
      window.location.reload();
    } catch (err) {
      console.error(err);
      setError("บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => callUpdateApi("OCR_Update");
  const handleReturnPackage = () => callUpdateApi("Return_Package");

  if (loading) {
    return (
      <div
        className="detail-app"
        style={{ "--bg-image": `url(${bg})` }}
      >
        <Navbar />
        <div className="admin-edit-wrapper">
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
        <div className="admin-edit-wrapper">
          <div className="admin-edit-card-shell">
            {/* ปุ่มย้อนกลับ */}
            <button
              className="admin-edit-back-btn"
              onClick={() => navigate(-1)}
            >
              ←
            </button>
            <div className="admin-edit-card">
              <p className="admin-edit-error">
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

      <div className="admin-edit-wrapper">
        <div className="admin-edit-card-shell">
          {/* ปุ่มย้อนกลับ */}
          <button
            className="admin-edit-back-btn"
            onClick={() => navigate(-1)}
          >
            ←
          </button>

          {pkg ? (
            <>
              <div className="admin-edit-card">
                {/* LEFT: รูป + ID */}
                <div className="admin-edit-left">
                  <div className="admin-edit-img-frame">
                    <img
                      src={imgSrc}
                      alt={`Package ${package_id}`}
                      className="admin-edit-img"
                    />
                  </div>
                  <div className="admin-edit-package-id">
                    Package ID : {package_id}
                  </div>
                </div>

                {/* MIDDLE: ฟอร์มแก้ไข */}
                <div className="admin-edit-middle">
                  <div className="admin-edit-status-row">
                    <span className="admin-edit-status-label">
                      สถานะปัจจุบัน :
                    </span>
                    <span>{status}</span>
                  </div>

                  <div className="admin-edit-section">
                    <div className="admin-edit-section-title">
                      รายละเอียดที่อยู่ผู้รับ-ผู้ส่ง (แก้ไขได้)
                    </div>

                    <div className="admin-edit-subtitle">ผู้ส่ง :</div>
                    <input
                      type="text"
                      name="sender_name"
                      className="admin-edit-input"
                      value={form.sender_name}
                      onChange={handleChange}
                      placeholder={sender_name || "ชื่อผู้ส่ง"}
                    />
                    <input
                      type="text"
                      name="sender_tel"
                      className="admin-edit-input"
                      value={form.sender_tel}
                      onChange={handleChange}
                      placeholder={sender_tel || "เบอร์โทรศัพท์ผู้ส่ง"}
                    />

                    <div className="admin-edit-subtitle">ผู้รับ :</div>
                    <input
                      type="text"
                      name="receiver_name"
                      className="admin-edit-input"
                      value={form.receiver_name}
                      onChange={handleChange}
                      placeholder={receiver_name || "ชื่อผู้รับ"}
                    />
                    <textarea
                      name="address"
                      className="admin-edit-textarea"
                      value={form.address}
                      onChange={handleChange}
                      placeholder={
                        address ||
                        "ที่อยู่ผู้รับ (รวมจังหวัด / รหัสไปรษณีย์)"
                      }
                    />
                    <input
                      type="text"
                      name="receiver_tel"
                      className="admin-edit-input"
                      value={form.receiver_tel}
                      onChange={handleChange}
                      placeholder={receiver_tel || "เบอร์โทรศัพท์ผู้รับ"}
                    />
                  </div>

                  {/* ผล OCR แบบตัวอักษรเปล่า ๆ ไม่มีกรอบ */}
                  <div className="admin-edit-section">
                    <div className="admin-edit-section-title">
                      ผลการ OCR ตรวจจับตัวอักษร
                    </div>
                    <div className="admin-edit-ocr-text">
                      {ocr_result || "-"}
                    </div>
                  </div>
                </div>

                {/* RIGHT: ข้อมูลองค์ประกอบพัสดุ */}
                <div className="admin-edit-right">
                  <div className="admin-edit-info-row">
                    <span>สร้างเมื่อ :</span>
                    <span>{formatDateTime(created_time)}</span>
                  </div>
                  <div className="admin-edit-info-row">
                    <span>อัปเดตล่าสุด :</span>
                    <span>{formatDateTime(updated_time)}</span>
                  </div>
                  <div className="admin-edit-info-row">
                    <span>ความกว้าง :</span>
                    <span>{width ? `${width} cm` : "-"}</span>
                  </div>
                  <div className="admin-edit-info-row">
                    <span>ความสูง :</span>
                    <span>{height ? `${height} cm` : "-"}</span>
                  </div>
                  <div className="admin-edit-info-row">
                    <span>ชนิดวัสดุ :</span>
                    <span>{material_type || "-"}</span>
                  </div>
                  <div className="admin-edit-info-row">
                    <span>พัสดุมีความเปราะบาง :</span>
                    <span>{fragile ? "ใช่" : "ไม่"}</span>
                  </div>
                </div>
              </div>

              {/* ปุ่มล่าง */}
              <div className="admin-edit-bottom">
                <button
                  type="button"
                  className="admin-edit-return-btn"
                  onClick={handleReturnPackage}
                  disabled={saving}
                >
                  return package
                </button>
                <button
                  type="button"
                  className="admin-edit-save-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  save
                </button>
              </div>

              {error && <p className="admin-edit-error">{error}</p>}
            </>
          ) : (
            <p className="admin-edit-error">ไม่พบข้อมูลพัสดุ</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPackageEdit;
