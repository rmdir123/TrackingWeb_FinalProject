// src/pages/UserHistory.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./UserHistory.css";
import bg from "../images/bg.png";

const API_BASE = "http://localhost:5000/api/v1";

function UserHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      // ยังไม่ได้ล็อกอิน → เด้งไปหน้า login
      navigate("/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API_BASE}/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const raw = res.data || [];

        // 1) เรียงจาก search_time ใหม่สุด → เก่าสุด
        const sorted = [...raw].sort((a, b) => {
          const ta = a.search_time ? new Date(a.search_time).getTime() : 0;
          const tb = b.search_time ? new Date(b.search_time).getTime() : 0;
          return tb - ta; // ใหม่ก่อน
        });

        // 2) ตัดซ้ำ: package_id เดียวกันให้เหลืออันล่าสุดอันเดียว
        const seen = new Set();
        const deduped = [];

        for (const item of sorted) {
          const key = item.package_id;
          if (key && seen.has(key)) {
            continue; // เคยมีแล้ว ข้าม
          }
          if (key) {
            seen.add(key);
          }
          deduped.push(item);
        }

        // 3) เซ็ตเข้า state
        setHistory(deduped);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          // token หมดอายุ/ไม่ถูกต้อง
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          setError("ไม่สามารถดึงประวัติการค้นหาได้ กรุณาลองใหม่อีกครั้ง");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [navigate]);

  const handleDelete = async (historyId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // จะใส่ confirm ไหมแล้วแต่
    const ok = window.confirm("ต้องการลบประวัติรายการนี้ใช่หรือไม่?");
    if (!ok) return;

    try {
      await axios.delete(`${API_BASE}/history/${historyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ลบจาก state ทันที
      setHistory((prev) =>
        prev.filter((item) => item.history_id !== historyId)
      );
    } catch (err) {
      console.error(err);
      alert("ลบประวัติไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  const formatDateTime = (dtString) => {
    if (!dtString) return "-";
    const d = new Date(dtString);
    if (Number.isNaN(d.getTime())) return dtString;
    return d.toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div
      className="app"
      style={{
        "--bg-image": `url(${bg})`, // ⭐ ตรงนี้แหละตัวสำคัญ
      }}
    >
      <Navbar />

      <main className="history-page">
        <h1 className="history-title">ประวัติการติดตามพัสดุ</h1>

        {loading && <p className="history-info">กำลังโหลดข้อมูล...</p>}
        {error && <p className="history-error">{error}</p>}

        {!loading && !error && history.length === 0 && (
          <p className="history-info">ยังไม่มีประวัติการค้นหา</p>
        )}

        {/* กล่องหลักที่เลื่อน scroll ได้ */}
        {!loading && history.length > 0 && (
          <div className="history-list-wrapper">
            <div className="history-list">
              {history.map((item) => (
                <div key={item.history_id} className="history-item">
                  {/* ⭐ กล่องรูปภาพพัสดุ ถ้ามี image_url */}
                  {item.image_url && (
                    <div className="history-image-wrapper">
                      <img
                        src={item.image_url}
                        alt={`พัสดุเลขที่ ${item.package_id}`}
                        className="history-image"
                      />
                    </div>
                  )}

                  <div className="history-main">
                    <div className="history-row">
                      <span className="history-label">พัสดุเลขที่</span>
                      <span className="history-value">
                        #{item.package_id ?? "-"}
                      </span>
                    </div>

                    <div className="history-row">
                      <span className="history-label">ผู้ส่ง</span>
                      <span className="history-value">
                        {item.sender_name || "-"}
                      </span>
                    </div>

                    <div className="history-row">
                      <span className="history-label">ผู้รับ</span>
                      <span className="history-value">
                        {item.receiver_name || "-"}
                      </span>
                    </div>

                    <div className="history-row">
                      <span className="history-label">สถานะ</span>
                      <span className="history-value">
                        {item.status || "-"}
                      </span>
                    </div>

                    <div className="history-row">
                      <span className="history-label">ปลายทาง</span>
                      <span className="history-value">
                        {item.province || "-"} {item.post_code || ""}
                      </span>
                    </div>
                  </div>

                  <div className="history-meta">
                    <span className="history-time">
                      {formatDateTime(item.search_time)}
                    </span>
                    <button
                      className="history-delete-btn"
                      onClick={() => handleDelete(item.history_id)}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default UserHistory;
