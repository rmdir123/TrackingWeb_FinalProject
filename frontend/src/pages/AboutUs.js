// src/pages/AboutUs.js
import React from "react";
import Navbar from "../components/Navbar";
import "./AboutUs.css";
import bg from "../images/bg.png";

function AboutUs() {
  return (
    <div
      className="app"
      style={{
        "--bg-image": `url(${bg})`,
      }}
    >
      <Navbar />

      <main className="about-page">
        <h1 className="about-title">เกี่ยวกับเรา</h1>

        <section className="about-card">
          <h2 className="about-section-title">ผู้จัดทำ</h2>
          <p className="about-text">
            นายกิตติ์ชินทักษ์ หรรษานนท์โชติ์ 65070018 <br />
            นายณัฐพงศ์ มาสำราญ 65070078
          </p>
        </section>

        <section className="about-card">
          <h2 className="about-section-title">เว็บไซต์สำหรับติดตามและควบคุมการทำงานของระบบ</h2>
          <p className="about-text">
            เว็บไซต์นี้ถูกพัฒนาขึ้นเพื่อให้ผู้ใช้สามารถติดตามสถานะการขนส่งพัสดุ นอกจากนี้ยังมีฟีเจอร์สำหรับผู้ดูแลระบบในการจัดการข้อมูลพัสดุและตรวจสอบประสิทธิภาพการขนส่ง รวมถึงการควบคุมการทำงานของระบบการขนส่งพัสดุอย่างมีประสิทธิภาพ <br />
            <br />
            โครงงานนี้เป็นส่วนหนึ่งของรายวิชา โครงงาน2 คณะเทคโนโลยีสารสนเทศ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง ภาคเรียนที่ 2/2568
          </p>
        </section>
      </main>
    </div>
  );
}

export default AboutUs;
