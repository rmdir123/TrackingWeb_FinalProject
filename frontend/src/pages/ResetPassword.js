// src/pages/ResetPassword.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";

import "./AdminHome.css";
import "./ResetPassword.css";
import bg from "../images/bg.png";
import Navbar from "../components/Navbar";

const API_BASE = "http://localhost:5000/api/v1/auth";

function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();

  // ถ้ามาจากหน้า UserInfo จะส่ง email ผ่าน location.state
  const presetEmail = location.state?.email || "";

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(presetEmail);
  const [emailLocked, setEmailLocked] = useState(!!presetEmail);

  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (presetEmail) {
      setEmailLocked(true);
    }
  }, [presetEmail]);

  const handleSendOtp = async () => {
    setError("");
    setInfo("");

    if (!email) {
      setError("กรุณากรอกอีเมล");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/forgot-password`, { email });
      setInfo("กรุณาตรวจสอบอีเมลของคุณ ระบบได้ส่งรหัส OTP ให้แล้ว");
      setStep(2);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "ไม่สามารถส่ง OTP ได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setInfo("");

    if (!email || !otp) {
      setError("กรุณากรอกอีเมลและ OTP ให้ครบ");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/verify-otp`, {
        email,
        otp,
      });
      setResetToken(res.data.reset_token);
      setInfo("OTP ถูกต้อง กรุณาตั้งรหัสผ่านใหม่");
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "ตรวจสอบ OTP ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setInfo("");

    if (!resetToken) {
      setError("ไม่มี reset_token กรุณาขอ OTP และยืนยันใหม่อีกครั้ง");
      setStep(1);
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("กรุณากรอก รหัสผ่านใหม่ และยืนยันรหัสผ่าน");
      return;
    }

    if (newPassword.length < 8) {
      setError("รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/reset-password`, {
        reset_token: resetToken,
        new_password: newPassword,
      });

      setInfo(res.data.message || "เปลี่ยนรหัสผ่านสำเร็จแล้ว");
      // เสร็จแล้วเด้งกลับหน้า login
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          "ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง"
      );
    } finally {
      setLoading(false);
    }
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
        <div className="reset-overlay">
          <div className="reset-card">
            <button className="reset-back-btn" onClick={goBack}>
              ←
            </button>

            <h2 className="reset-title">เปลี่ยนรหัสผ่าน</h2>
            <p className="reset-desc">
              กรุณากรอกอีเมลที่คุณใช้สมัคร ระบบจะส่งรหัส OTP ไปยังอีเมลของคุณ
              เพื่อนำไปใช้ยืนยันตัวตนก่อนตั้งรหัสผ่านใหม่
            </p>

            {error && <p className="reset-error">{error}</p>}
            {info && <p className="reset-info">{info}</p>}

            {/* STEP 1: Email */}
            {step === 1 && (
              <>
                <div className="reset-group">
                  <label className="reset-label">Email</label>
                  <input
                    type="email"
                    className="reset-input reset-input-large"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={emailLocked}
                    placeholder="กรอกอีเมลที่ใช้สมัคร"
                  />
                  {emailLocked && (
                    <p className="reset-hint">
                      ใช้อีเมลจากบัญชีของคุณในการรับ OTP
                    </p>
                  )}
                </div>

                <div className="reset-actions">
                  <button
                    className="reset-main-btn"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    {loading ? "กำลังส่ง OTP..." : "ส่ง OTP"}
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: OTP */}
            {step === 2 && (
              <>
                <div className="reset-group">
                  <label className="reset-label">Email</label>
                  <input
                    type="email"
                    className="reset-input"
                    value={email}
                    disabled
                  />
                </div>

                <div className="reset-group">
                  <label className="reset-label">OTP</label>
                  <input
                    type="text"
                    className="reset-input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="รหัส OTP 6 หลัก"
                  />
                </div>

                <div className="reset-actions between">
                  <button
                    className="reset-secondary-btn"
                    onClick={() => setStep(1)}
                    disabled={loading}
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    className="reset-main-btn"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? "กำลังตรวจสอบ..." : "ยืนยัน OTP"}
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: New Password */}
            {step === 3 && (
              <>
                <div className="reset-group">
                  <label className="reset-label">รหัสผ่านใหม่</label>
                  <input
                    type="password"
                    className="reset-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                  />
                </div>

                <div className="reset-group">
                  <label className="reset-label">ยืนยันรหัสผ่านใหม่</label>
                  <input
                    type="password"
                    className="reset-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="พิมพ์ซ้ำอีกครั้ง"
                  />
                </div>

                <div className="reset-actions between">
                  <button
                    className="reset-secondary-btn"
                    onClick={() => setStep(2)}
                    disabled={loading}
                  >
                    ย้อนกลับ
                  </button>
                  <button
                    className="reset-main-btn"
                    onClick={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
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

export default ResetPassword;
