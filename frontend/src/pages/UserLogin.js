// src/pages/UserLogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import axios from "axios";                    // <--- เพิ่ม
import "./UserLogin.css";

import weblogo from "../images/weblogo.png";
import bg from "../images/bg.png";
import Navbar from "../components/Navbar";   

// แก้ URL ให้ตรงกับ Swagger ของมึง
const LOGIN_URL = "http://localhost:5000/api/v1/auth/login";

function UserLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev || "auto");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((old) => ({ ...old, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        username: form.username,
        password: form.password,
      };

      const res = await axios.post(LOGIN_URL, payload);

      // สมมติ backend ส่งแบบนี้กลับมา:
      // { token: "...", user: { id, username, role } }
      const { token, user } = res.data;

      // เก็บ token ไว้ใช้เรียก API หน้าอื่น
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // จะ redirect ไปไหนก็แล้วแต่มึง
      // เช่น ถ้า role เป็น admin → ไปหน้า AdminHome
      if (user?.role === "admin") {
        navigate("/admin_home");
      } else {
        navigate("/user_home"); // หรือหน้า user home
      }
    } catch (err) {
      console.error(err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้หรือรหัสผ่าน");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-app"
      style={{
        "--bg-image": `url(${bg})`,
      }}
    >
      {/* NAVBAR */}
      <Navbar />

      {/* CONTENT */}
      <main className="login-content">
        <div className="login-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ←
          </button>

          <div className="login-box">
            <h1 className="login-title">Login</h1>
            <p className="login-sub">
              โปรดป้อนชื่อผู้ใช้และรหัสผ่านเพื่อเข้าสู่ระบบ
            </p>

            {/* แสดง error ถ้ามี */}
            {error && <p className="login-error">{error}</p>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <label>Username</label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="login-field">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="button"
                className="forgot-link"
                onClick={() => alert("ฟีเจอร์ลืมรหัสผ่านยังไม่ได้ทำจ้า")}
              >
                ลืมรหัสผ่าน?
              </button>

              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "Login"}
              </button>
            </form>
          </div>
        </div>

        <div className="login-right" />
      </main>
    </div>
  );
}

export default UserLogin;
