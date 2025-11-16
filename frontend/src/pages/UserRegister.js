// src/pages/UserRegister.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "./UserRegister.css";  // ← ใช้ไฟล์แยก
import weblogo from "../images/weblogo.png";
import bg from "../images/bg.png";
import axios from "axios";

function UserRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    phone: "",
  });

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

  try {
    // เตรียมข้อมูลจากฟอร์ม
    const payload = {
      username: form.username,
      password: form.password,
      email: form.email,
      phone: form.phone,
    };

    // ยิงไป backend (ตัวเดียวกับที่ swagger ใช้)
    const res = await axios.post(
      "http://localhost:5000/api/v1/auth/register",   // <-- แก้ให้ตรงของมึง
      payload
    );

    console.log("REGISTER OK:", res.data);

    // ถ้าอยากโชว์แจ้งเตือน / redirect
        alert("สมัครสมาชิกสำเร็จ!");
        navigate("/login");    // <-- ส่งไปหน้า Login ทันที
    // navigate("/login");
        } catch (err) {
            console.error("REGISTER ERROR:", err);
            alert("สมัครไม่สำเร็จ ลองใหม่อีกครั้ง");
        }
    };

  return (
    <div
      className="register-app"
      style={{
        "--bg-image": `url(${bg})`,
      }}
    >
      {/* NAVBAR */}
      <header className="header">
        <div className="nav-logo">
          <img src={weblogo} alt="Logo" className="logo-img" />
        </div>

        <nav className="nav-menu">
          <Link to="/">Home</Link>
          <Link to="/user_history">History</Link>
          <Link to="/">About Us</Link>
        </nav>

        <div className="nav-auth">
          <Link to="/register" className="nav-auth-link active">Register</Link>
          <span className="sep">|</span>
          <Link to="/login" className="nav-auth-link">Login</Link>
        </div>
      </header>
      
      <main className="register-content">
        {/* ฝั่งซ้าย: panel ฟอร์ม */}
        <div className="register-left">
            <button className="back-btn" onClick={() => navigate(-1)}>
            ←
            </button>

            <div className="reg-box">
            <h1 className="reg-title">Register</h1>
            <p className="reg-sub">
                โปรดป้อนชื่อผู้ใช้, รหัสผ่าน, Email, เบอร์โทรศัพท์เพื่อสมัครเข้าใช้งาน
            </p>

            <form className="reg-form" onSubmit={handleSubmit}>
                <div className="reg-field">
                <label>Username</label>
                <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                />
                </div>

                <div className="reg-field">
                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                />
                </div>

                <div className="reg-field">
                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                />
                </div>

                <div className="reg-field">
                <label>Phone Number</label>
                <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                />
                </div>

                <button className="reg-submit" type="submit">
                Register
                </button>
            </form>
            </div>
        </div>

        {/* ฝั่งขวา: รูปพื้นหลัง */}
        <div className="register-right" />
        </main>
    </div>
  );
}

export default UserRegister;
