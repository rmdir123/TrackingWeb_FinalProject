// src/pages/UserInfo.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "./AdminHome.css"; // ใช้พื้นหลัง/โครง layout เดียวกับหน้าอื่น
import "./UserInfo.css";
import bg from "../images/bg.png";
import Navbar from "../components/Navbar";

function UserInfo() {
  const [form, setForm] = useState({
    user_id: "",
    username: "",
    email: "",
    phone: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("กรุณาเข้าสู่ระบบก่อน");
      setLoading(false);
      navigate("/login");
      return;
    }

    const fetchMe = async () => {
      try {
        setError("");
        const res = await axios.get(
          "http://localhost:5000/api/v1/userinfo/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setForm({
          user_id: res.data.user_id,
          username: res.data.username,
          email: res.data.email || "",
          phone: res.data.phone || "",
        });
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setError("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
          navigate("/login");
        } else {
          setError("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("กรุณาเข้าสู่ระบบก่อน");
      navigate("/login");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // ❗ ส่งเฉพาะ field ที่แก้ได้ = phone
      await axios.put(
        "http://localhost:5000/api/v1/userinfo/me",
        {
          phone: form.phone,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      setError("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  const goChangePassword = () => {
    navigate("/resetpassword", {
      state: { email: form.email },
    });
  };

  const goBack = () => {
    navigate(-1);
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
        <div className="userinfo-overlay">
          <div className="userinfo-card">
            <button className="userinfo-back-btn" onClick={goBack}>
              ←
            </button>

            <h2 className="userinfo-title">รายละเอียดบัญชี</h2>

            {loading ? (
              <p className="userinfo-status">กำลังโหลดข้อมูล...</p>
            ) : (
              <>
                {error && <p className="userinfo-error">{error}</p>}
                {success && <p className="userinfo-success">{success}</p>}

                <div className="userinfo-group">
                  <label className="userinfo-label">Username</label>
                  <div className="userinfo-static userinfo-username">
                    {form.username}
                  </div>
                </div>

                <div className="userinfo-group">
                  <label className="userinfo-label">Password</label>
                  <div className="userinfo-pass-row">
                    <span className="userinfo-static">********</span>
                    <button
                      type="button"
                      className="userinfo-change-btn"
                      onClick={goChangePassword}
                    >
                      change
                    </button>
                  </div>
                </div>

                <div className="userinfo-group">
                  <label className="userinfo-label">Email</label>
                  <div className="userinfo-static">{form.email || "-"}</div>
                </div>

                <div className="userinfo-group">
                  <label className="userinfo-label">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    className="userinfo-input"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="095-999-9393"
                  />
                </div>

                <div className="userinfo-actions">
                  <button
                    type="button"
                    className="userinfo-save-btn"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "saving..." : "save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserInfo;
