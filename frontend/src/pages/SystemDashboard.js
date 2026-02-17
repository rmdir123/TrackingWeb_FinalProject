import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./ManagerHome.css";
import { useNavigate } from "react-router-dom";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
} from "recharts";

function SystemDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [history, setHistory] = useState(null);

  const fetchData = async () => {
    try {
      const [overviewRes, historyRes] = await Promise.all([
        axios.get("http://localhost:5000/api/v1/aws/metrics/overview"),
        axios.get("http://localhost:5000/api/v1/aws/metrics/history"),
      ]);

      setOverview(overviewRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error("โหลด dashboard ไม่สำเร็จ", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const healthColor = (status) => {
    if (status === "healthy") return "#22c55e";
    if (status === "warning") return "#f59e0b";
    return "#ef4444";
  };

  if (!overview || !history) return null;

  return (
    <div className="app" style={{ "--bg-image": "url('/images/bg.png')" }}>
      <Navbar />

      <main className="content manager-content">
        <div className="manager-livecam-wrapper">
          <div
            className="manager-livecam"
            style={{ width: "1350px", position: "relative" }}
          >
            {/* ===== SYSTEM HEALTH ===== */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "25px",
              }}
            >
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
                  transition: "0.2s",
                }}
                
              >
                ←
              </button>

              <h2 style={{ color: "white" }}>
                System Status:
                <span
                  style={{
                    marginLeft: "10px",
                    color: healthColor(overview.health.system),
                    textShadow: `0 0 10px ${healthColor(
                      overview.health.system,
                    )}`,
                  }}
                >
                  {overview.health.system.toUpperCase()}
                </span>
              </h2>
              <p style={{ color: "#aaa" }}>Uptime: {overview.uptimePercent}%</p>
            </div>

            {/* ===== KPI SECTION ===== */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              <div className="manager-box">
                <h3>EC2 CPU</h3>
                <p style={{ fontSize: "26px", color: "#22c55e" }}>
                  {overview.ec2.cpuCurrent}%
                </p>
                <small>
                  Avg: {overview.ec2.cpuAvg}% | Max: {overview.ec2.cpuMax}%
                </small>
              </div>

              <div className="manager-box">
                <h3>RDS CPU</h3>
                <p style={{ fontSize: "26px", color: "#3b82f6" }}>
                  {overview.rds.cpuCurrent}%
                </p>
                <small>
                  Avg: {overview.rds.cpuAvg}% | Max: {overview.rds.cpuMax}%
                </small>
              </div>

              <div className="manager-box">
                <h3>DB Connections</h3>
                <p style={{ fontSize: "26px" }}>{overview.rds.connections}</p>
              </div>

              <div className="manager-box">
                <h3>S3 Storage</h3>
                <p style={{ fontSize: "26px" }}>
                  {overview.s3.bucketSizeGB} GB
                </p>
              </div>
            </div>

            {/* ===== CPU GRAPH ===== */}
            <div className="manager-box" style={{ marginBottom: "30px" }}>
              <h3>CPU Usage (Last 1 Hour)</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={history.cpu}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="#fff" />
                  <YAxis domain={["auto", "auto"]} stroke="#fff" />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ec2"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={false}
                    name="EC2 CPU"
                  />
                  <Line
                    type="monotone"
                    dataKey="rds"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                    name="RDS CPU"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ===== NETWORK GRAPH ===== */}
            <div className="manager-box">
              <h3>Network Traffic (Last 1 Hour)</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={history.network}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" stroke="#fff" />
                  <YAxis stroke="#fff" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="in"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                    name="Network In"
                  />
                  <Area
                    type="monotone"
                    dataKey="out"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.4}
                    name="Network Out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SystemDashboard;
