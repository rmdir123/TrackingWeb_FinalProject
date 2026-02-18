// src/pages/AdminHome.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "./AdminHome.css";
import "./TrackPackage.css";
import bg from "../images/bg.png";
import weblogo from "../images/weblogo.png";

import Navbar from "../components/Navbar";

const API_BASE = "http://43.209.65.64:5000/api/v1";

// ฟอร์แมตวันที่-เวลา
const formatDateTime = (dt) => {
  if (!dt) return "-";
  const d = new Date(dt);
  if (Number.isNaN(d.getTime())) return dt;
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

  const [notification, setNotification] = useState(null);
  const [notificationError, setNotificationError] = useState("");

  // =======================
  // ⭐ ใช้ secure api ก่อนเข้า detail
  // =======================
  const handleViewDetail = async (packageId) => {
    const token = localStorage.getItem("token");

    try {
      const url = token
        ? `${API_BASE}/secure/packages/${packageId}`
        : `${API_BASE}/packages/${packageId}`;

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.get(url, { headers });

      // backend insert history แล้ว
      navigate(`/package/${packageId}/detail`);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        alert("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        alert("ไม่สามารถเปิดดูรายละเอียดได้");
      }
    }
  };

  // =======================
  // Notification
  // =======================
  async function fetchFirstUnreadNotification() {
    try {
      setNotificationError("");
      const res = await axios.get(`${API_BASE}/notifications?status=UNREAD`);

      const list = res.data?.data || res.data?.notifications || [];

      if (Array.isArray(list) && list.length > 0) {
        setNotification(list[0]);
      } else {
        setNotification(null);
      }
    } catch (err) {
      console.error(err);
      setNotificationError("ไม่สามารถโหลดแจ้งเตือน OCR ได้");
    }
  }

  useEffect(() => {
    axios
      .get(`${API_BASE}/packages`)
      .then((res) => setPackages(res.data?.data || []))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE}/package/ocrfail`)
      .then((res) => {
        setOcrFailPackages(res.data?.data || []);
      })
      .catch((err) => {
        console.error(err);
        setOcrFailError("โหลดข้อมูลพัสดุ OCR_Fail ไม่สำเร็จ");
      });
  }, []);

  useEffect(() => {
    fetchFirstUnreadNotification();
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev || "auto");
  }, []);

  // =======================
  // Search
  // =======================
  const handleSearch = async (e) => {
    e.preventDefault();

    const id = searchId.trim();
    if (!id) return;

    try {
      setSearchError("");
      setSearchResult(null);

      const token = localStorage.getItem("token");

      const url = token
        ? `${API_BASE}/secure/packages/${id}`
        : `${API_BASE}/packages/${id}`;

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

  const handleCloseNotification = async () => {
    if (!notification) return;

    try {
      await axios.patch(`${API_BASE}/notifications/${notification.id}/read`);
      await fetchFirstUnreadNotification();
    } catch (err) {
      console.error(err);
      setNotificationError("ไม่สามารถอัปเดตสถานะแจ้งเตือนได้");
    }
  };

  return (
    <div
      className="app"
      style={{
        "--bg-image": `url(${bg})`,
      }}
    >
      <Navbar />

      <main className="content">
        {/* Notification */}
        {notification && (
          <div className="ocr-toast-container">
            <div className="ocr-popup">
              <div className="ocr-popup-title">OCR Failure</div>
              <div className="ocr-popup-text">
                Package ID : {notification.package_id}
              </div>
              <button
                type="button"
                className="ocr-popup-close-btn"
                onClick={handleCloseNotification}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {notificationError && (
          <p className="error-text" style={{ marginTop: "8px" }}>
            {notificationError}
          </p>
        )}

        {/* Search */}
        <form className="search-box-wrapper" onSubmit={handleSearch}>
          <input
            type="text"
            className="search-box"
            placeholder="กรอก Package ID เพื่อค้นหา แล้วกด Enter"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
        </form>

        {searchError && <p className="error-text">{searchError}</p>}

        {/* Search Result */}
        {searchResult && (
          <div className="trackpage-result-shell">
            <button className="trackpage-back-btn" onClick={clearSearchResult}>
              ←
            </button>

            <div className="trackpage-result-box">
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

              <div className="trackpage-right">
                <div className="trackpage-status-row">
                  <span className="trackpage-status-label">
                    สถานะปัจจุบัน :
                  </span>
                  <span className="trackpage-status-value">
                    {searchResult.current_status || searchResult.status}
                  </span>
                </div>

                <div className="trackpage-detail-row">
                  <button
                    className="trackpage-detail-btn"
                    onClick={() => handleViewDetail(searchResult.package_id)}
                  >
                    รายละเอียดพัสดุ ⬇
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* รายการพัสดุทั้งหมด */}
        <h2 className="subtitle">รายการพัสดุทั้งหมด</h2>
        <div className="packet-list-container">
          <ul className="packet-list">
            {packages.map((pkg) => (
              <li
                key={pkg.package_id}
                className="packet-item"
                onClick={() => handleViewDetail(pkg.package_id)}
                style={{ cursor: "pointer" }}
              >
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
