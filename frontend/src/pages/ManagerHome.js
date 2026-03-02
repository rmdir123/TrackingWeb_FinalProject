// src/pages/ManagerHome.js
import { io } from "socket.io-client";
import axios from "axios";
import "./ManagerHome.css";
import bg from "../images/bg.png";
import Navbar from "../components/Navbar";
import weblogo from "../images/weblogo.png";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, useRef } from "react";


function ManagerHome() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const socket = io("https://parcelweb.store");
  const room = "live-room";

  // Robot Mode
  const [robotMode, setRobotMode] = useState("");
  const [modeLoading, setModeLoading] = useState(false);

  const [formMode, setFormMode] = useState(null); // "add" | "edit" | null
  const [formData, setFormData] = useState({
    user_id: null,
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [formError, setFormError] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  const navigate = useNavigate();

  const fetchRobotMode = async () => {
    try {
      const res = await axios.get(
        "/api/v1/manager/robotmode",
      );
      setRobotMode(res.data.status?.toLowerCase());
    } catch (err) {
      console.error("โหลด robot mode ไม่สำเร็จ", err);
    }
  };

  const handleChangeMode = async (mode) => {
    if (mode === robotMode) return;

    try {
      setModeLoading(true);

      await axios.put("/api/v1/manager/robotmode", {
        status: mode,
      });

      setRobotMode(mode);
    } catch (err) {
      console.error("เปลี่ยน mode ไม่สำเร็จ", err);
    } finally {
      setModeLoading(false);
    }
  };

  // โหลดรายชื่อ admin ทั้งหมด (ไม่ต้อง auth)
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(
        "/api/v1/admin/admins",
      );
      setAdmins(res.data || []);
    } catch (err) {
      console.error(err);
      setError("โหลดข้อมูล admin ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchRobotMode();
  }, []);

  useEffect(() => {
  const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:43.209.65.64:3478",
      username: "user",
      credential: "trackingwebsecret"
    }
  ]
});

  socket.emit("join-room", room);

  pc.ontrack = (event) => {
    if (videoRef.current) {
      videoRef.current.srcObject = event.streams[0];
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log("ICE state:", pc.iceConnectionState);
  };

  pc.onicecandidate = (event) => {
  if (event.candidate) {
    console.log("Candidate:", event.candidate.candidate);
  }
};

  socket.on("offer", async (offer) => {
    console.log("✅ Received offer");
    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit("answer", { room, answer });
  });

  socket.on("ice-candidate", async (candidate) => {
    await pc.addIceCandidate(candidate);
  });

  return () => {
    pc.close();
  };
}, []);

  // ---------- ฟอร์ม Add / Edit ----------
  const openAddForm = () => {
    setFormMode("add");
    setFormError("");
    setFormData({
      user_id: null,
      username: "",
      email: "",
      phone: "",
      password: "",
    });
  };

  const openEditForm = (admin) => {
    setFormMode("edit");
    setFormError("");
    setFormData({
      user_id: admin.user_id,
      username: admin.username || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: "",
    });
  };

  const closeForm = () => {
    setFormMode(null);
    setFormError("");
    setFormSaving(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setFormError("กรุณาเข้าสู่ระบบด้วยบัญชี system_manager ก่อน");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      setFormSaving(true);

      if (formMode === "add") {
        // validate
        if (!formData.username || !formData.email || !formData.phone) {
          setFormError("กรุณากรอก username, email, phone ให้ครบ");
          setFormSaving(false);
          return;
        }
        if (!formData.password || formData.password.length < 8) {
          setFormError("password ต้องยาวอย่างน้อย 8 ตัวอักษร");
          setFormSaving(false);
          return;
        }

        await axios.post(
          "/api/v1/admin/users",
          {
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            role: "admin", // system_manager สร้างได้เฉพาะ admin
          },
          { headers },
        );
      } else if (formMode === "edit") {
        if (!formData.user_id) {
          setFormError("ไม่พบ user_id");
          setFormSaving(false);
          return;
        }

        await axios.put(
          `/api/v1/admin/users/${formData.user_id}`,
          {
            username: formData.username,
            email: formData.email,
            phone: formData.phone,
            role: "admin",
          },
          { headers },
        );
      }

      await fetchAdmins();
      closeForm();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        "เกิดข้อผิดพลาดขณะบันทึกข้อมูล (ตรวจสอบสิทธิ์ system_manager ด้วย)";
      setFormError(msg);
      setFormSaving(false);
    }
  };

  // ---------- ลบ admin ----------
  const handleDelete = async (admin) => {
    if (!window.confirm(`ต้องการลบ admin "${admin.username}" ใช่ไหม?`)) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("กรุณาเข้าสู่ระบบด้วยบัญชี system_manager ก่อน");
      return;
    }

    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.delete(
        `/api/v1/admin/users/${admin.user_id}`,
        { headers },
      );
      await fetchAdmins();
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.error ||
        "ไม่สามารถลบ admin ได้ (อาจไม่มีสิทธิ์ system_manager)";
      alert(msg);
    }
  };

  return (
    <div
      className="app"
      style={{
        "--bg-image": "url('/images/bg.png')",
      }}
    >
      <Navbar />

      <main className="content manager-content">
        {/* ========== TOP: Controls ซ้าย + Live Cam กลาง ========== */}
        <div className="manager-top">
          {/* ซ้าย: กล่องควบคุม + ปุ่มลัด 3 ปุ่ม */}
          <div className="manager-controls">
            {/* กล่อง 1: Conveyor */}
            <div className="manager-box">
              <h3>Conveyor Belt</h3>
              <p>
                Current : <span className="status-on">on</span>
              </p>
              <button
                className="btn-green"
                onClick={() => console.log("start")}
              >
                start
              </button>
              <button className="btn-red" onClick={() => console.log("stop")}>
                stop
              </button>
            </div>

            {/* กล่อง 2: Sorting Mode */}
            <div className="manager-box">
              <h3>Sorting Mode</h3>
              <p>
                Current :{" "}
                <span className="status-on">
                  {robotMode ? robotMode.toUpperCase() : "Loading..."}
                </span>
              </p>

              <button
                className={robotMode === "ocr" ? "btn-green" : "btn-gray"}
                onClick={() => handleChangeMode("ocr")}
                disabled={modeLoading}
              >
                OCR
              </button>

              <button
                className={robotMode === "material" ? "btn-green" : "btn-gray"}
                onClick={() => handleChangeMode("material")}
                disabled={modeLoading}
              >
                Material
              </button>
            </div>

            {/* กล่อง 3: Manager Navigation */}
            <div className="manager-box manager-nav-box">
              <button
                type="button"
                className="btn-nav"
                onClick={() => navigate("/packagedashboard")}
              >
                Package Dashboard
              </button>
              <button
                type="button"
                className="btn-nav"
                onClick={() => navigate("/systemdashboard")}
              >
                System Dashboard
              </button>

              <button
                type="button"
                className="btn-nav"
                onClick={() => navigate("/editedpackages")}
              >
                Edited Packages
              </button>
            </div>
          </div>

          {/* กลาง: Live Camera */}
          <div className="manager-livecam-wrapper">
            <div className="manager-livecam">
              <h3>Live Camera</h3>
              <div className="livecam-frame">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            </div>
          </div>
        </div>

        {/* ========== TABLE: Manage Admin Account ========== */}
        <section className="manager-admin-section">
          <div className="manager-admin-header">
            <h2 className="manager-admin-title">Manage Admin Account</h2>
            <button
              type="button"
              className="btn-add-admin"
              onClick={openAddForm}
            >
              add
            </button>
          </div>

          {loading && <p className="info-text">กำลังโหลดข้อมูล...</p>}
          {error && <p className="error-text">{error}</p>}

          <div className="manager-table-wrapper">
            <table className="manager-admin-table">
              <thead>
                <tr>
                  <th>user_id</th>
                  <th>username</th>
                  <th>email</th>
                  <th>phone</th>
                  <th>role</th>
                  <th>action</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((adm) => (
                  <tr key={adm.user_id}>
                    <td>{adm.user_id}</td>
                    <td>{adm.username}</td>
                    <td>{adm.email}</td>
                    <td>{adm.phone}</td>
                    <td>{adm.role}</td>
                    <td className="manager-action-cell">
                      <button
                        type="button"
                        className="icon-btn edit"
                        title="แก้ไข"
                        onClick={() => openEditForm(adm)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="icon-btn delete"
                        title="ลบ"
                        onClick={() => handleDelete(adm)}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && admins.length === 0 && (
                  <tr>
                    <td colSpan={6} className="manager-empty">
                      ยังไม่มี admin
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========== Popup ฟอร์ม Add/Edit ========== */}
          {formMode && (
            <div className="manager-form-overlay">
              <div className="manager-form-card">
                <div className="manager-form-header">
                  <h3>
                    {formMode === "add"
                      ? "เพิ่มบัญชี Admin ใหม่"
                      : `แก้ไข Admin #${formData.user_id}`}
                  </h3>
                  <button
                    type="button"
                    className="manager-form-close"
                    onClick={closeForm}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="manager-form-body">
                  <div className="form-row">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <label>Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {formMode === "add" && (
                    <div className="form-row">
                      <label>Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={8}
                      />
                    </div>
                  )}

                  <div className="form-row">
                    <label>Role</label>
                    <input type="text" value="admin" disabled />
                    <small className="hint-text">
                      System Manager ใช้หน้าจอนี้ในการจัดการ Admin เท่านั้น
                    </small>
                  </div>

                  {formError && (
                    <p className="error-text" style={{ marginTop: 4 }}>
                      {formError}
                    </p>
                  )}

                  <div className="manager-form-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={closeForm}
                      disabled={formSaving}
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="btn-save"
                      disabled={formSaving}
                    >
                      {formSaving
                        ? "กำลังบันทึก..."
                        : formMode === "add"
                          ? "เพิ่ม Admin"
                          : "บันทึกการแก้ไข"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default ManagerHome;
