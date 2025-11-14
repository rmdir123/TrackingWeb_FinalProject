// src/pages/UserHistory.js
import React from "react";
import "./UserHistory.css"; // จะมีหรือไม่มีก็ได้ ถ้ายังไม่สร้าง

import bg from "../images/bg.png";
import weblogo from "../images/weblogo.png";
import { Link } from "react-router-dom";

function UserHistory() {
  return (
    <div
      className="app"
      style={{
        "--bg-image": `url(${bg})`,
      }}
    >
      {/* NAVBAR ใช้ร่วมทุกหน้า */}
      <header className="header">
        <div className="nav-logo">
          <img src={weblogo} alt="Logo" className="logo-img" />
        </div>

        <nav className="nav-menu">
          <Link to="/">Home</Link>
          <Link to="/user_history">History</Link>
          <Link to="/">About Us</Link>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <main className="content">
        <h2 className="subtitle">ประวัติพัสดุ (User History)</h2>
        <p>หน้านี้ไว้แสดงประวัติพัสดุของผู้ใช้ — เดี๋ยวค่อยเติม API ทีหลัง</p>
      </main>
    </div>
  );
}

export default UserHistory;
