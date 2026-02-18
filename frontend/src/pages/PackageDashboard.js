import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./ManagerHome.css";
import { useNavigate } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

function PackageDashboard() {
  const navigate = useNavigate();
  const [regionData, setRegionData] = useState([]);
  const [statusData, setStatusData] = useState([]);

  const fetchData = async () => {
    try {
      const [regionRes, statusRes] = await Promise.all([
        axios.get(
          "http://43.209.65.64:5000/api/v1/package-dashboard/region-summary",
        ),
        axios.get(
          "http://43.209.65.64:5000/api/v1/package-dashboard/status-summary",
        ),
      ]);

      setRegionData(regionRes.data);
      setStatusData(statusRes.data);
    } catch (err) {
      console.error("โหลด package dashboard ไม่สำเร็จ", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!regionData || !statusData) return null;

  return (
    <div className="app" style={{ "--bg-image": "url('/images/bg.png')" }}>
      <Navbar />

      <main className="content manager-content">
        <div className="manager-livecam-wrapper">
          <div
            className="manager-livecam"
            style={{ width: "1350px", position: "relative" }}
          >
            {/* ===== HEADER ===== */}
            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  position: "absolute",
                  top: "20px",
                  left: "20px",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "22px",
                  cursor: "pointer",
                }}
              >
                ←
              </button>

              <h2 style={{ color: "white" }}>Package Dashboard</h2>
              <p style={{ color: "#aaa" }}>
                สรุปจำนวนพัสดุแยกตามภาคและสถานะ
              </p>
            </div>

            {/* ===== REGION GRAPH ===== */}
            <div className="manager-box" style={{ marginBottom: "30px" }}>
              <h3>Packages by Region</h3>

              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" stroke="#fff" />
                  <YAxis
                    domain={[0, "auto"]}
                    allowDecimals={false}
                    stroke="#fff"
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="total"
                    fill="#22c55e"
                    name="จำนวนพัสดุ"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ===== STATUS GRAPH ===== */}
            <div className="manager-box">
              <h3>Packages by Status</h3>

              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" stroke="#fff" />
                  <YAxis
                    domain={[0, "auto"]}
                    allowDecimals={false}
                    stroke="#fff"
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="total"
                    fill="#3b82f6"
                    name="จำนวนพัสดุ"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PackageDashboard;
