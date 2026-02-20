// src/pages/EditedPackages.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./UserHistory.css";
import bg from "../images/bg.png";

const API_BASE = "/api/v1";

function EditedPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await axios.get(`${API_BASE}/packages/edited`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setPackages(res.data || []);
      } catch (err) {
        console.error(err);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          setError("ไม่สามารถดึงรายการพัสดุที่ถูกแก้ไขได้");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [navigate]);

  const formatDateTime = (dtString) => {
    if (!dtString) return "-";
    const d = new Date(dtString);
    if (Number.isNaN(d.getTime())) return dtString;
    return d.toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const handleViewDetail = async (packageId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      await axios.get(`${API_BASE}/secure/packages/${packageId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      navigate(`/package/${packageId}/detail`);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        alert("ไม่สามารถเปิดดูรายละเอียดได้");
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
      <Navbar />

      <main className="history-page">
        {/* HEADER + BACK BUTTON */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #ffffff",
              background: "rgba(0,0,0,0.6)",
              color: "#ffffff",
              fontSize: "20px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
            }}
          >
            ←
          </button>

          <h1 className="history-title">รายการพัสดุที่ถูกแก้ไข</h1>
        </div>

        {loading && <p className="history-info">กำลังโหลดข้อมูล...</p>}
        {error && <p className="history-error">{error}</p>}

        {!loading && packages.length === 0 && (
          <p className="history-info">ไม่มีพัสดุที่ถูกแก้ไข</p>
        )}

        {!loading && packages.length > 0 && (
          <div className="history-list-wrapper">
            <div className="history-list">
              {packages.map((item) => (
                <div
                  key={item.package_id}
                  className="history-item"
                  onClick={() => handleViewDetail(item.package_id)}
                  style={{ cursor: "pointer" }}
                >
                  {item.package_img && (
                    <div className="history-image-wrapper">
                      <img
                        src={item.package_img}
                        alt={`พัสดุ ${item.package_id}`}
                        className="history-image"
                      />
                    </div>
                  )}

                  <div className="history-main">
                    <div className="history-row">
                      <span className="history-label">พัสดุเลขที่</span>
                      <span className="history-value">#{item.package_id}</span>
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
                      <span className="history-label">จังหวัด</span>
                      <span className="history-value">
                        {item.province || "-"} {item.post_code || ""}
                      </span>
                    </div>

                    <div className="history-row">
                      <span className="history-label">แก้ไขโดย</span>
                      <span className="history-value">
                        {item.modify_by || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="history-meta">
                    <span className="history-time">
                      {formatDateTime(item.updated_time)}
                    </span>
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

export default EditedPackages;
