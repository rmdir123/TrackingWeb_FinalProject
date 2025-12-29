import React, { useState } from "react";
import "./UserHome.css";
import "./AdminHome.css"; // 👈 ดึงดีไซน์ search-box แบบเดียวกับ AdminHome :contentReference[oaicite:0]{index=0}

import bg from "../images/bg.png";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

function UserHome() {
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState("");

  const handleSearch = () => {
    if (!trackingId.trim()) return;
    navigate(`/track/${trackingId.trim()}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <div
      className="userhome-app"
      style={{
        "--bg-image": "url('/images/bg.png')",
      }}
    >
      <Navbar />

      <main className="userhome-wrapper">
        {/* 🔍 SEARCH BAR แบบเดียวกับ AdminHome */}
        <form className="search-box-wrapper" onSubmit={handleSubmit}>
          <input
            type="text"
            className="search-box"
            placeholder="กรอก Package ID เพื่อค้นหา แล้วกด Enter"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
          />
        </form>

        {/* เนื้อหาเดิม */}
        <div className="userhome-content">
          <p>
            ระบบติดตามพัสดุ CN-EXPRESS ช่วยให้คุณสามารถตรวจสอบสถานะการจัดส่งของพัสดุ
            ได้แบบเรียลไทม์ เพียงกรอกหมายเลข Package ID ของคุณในช่องค้นหาด้านบน
            ก็จะทราบได้ทันทีว่าพัสดุอยู่ที่จุดใดระหว่างการขนส่ง
          </p>
          <p>
            หากคุณมีหลายพัสดุจากการส่งครั้งเดียว แนะนำให้บันทึกหมายเลข Package ID ไว้
            เพื่อความสะดวกในการติดตามภายหลัง และในอนาคตระบบจะเชื่อมต่อกับประวัติการค้นหา
            ของคุณ ทำให้กลับมาดูรายการเดิมได้ง่ายขึ้น โดยไม่ต้องกรอกเลขใหม่ทุกครั้ง
          </p>
        </div>
      </main>
    </div>
  );
}

export default UserHome;
