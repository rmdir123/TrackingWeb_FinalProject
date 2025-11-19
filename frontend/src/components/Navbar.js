// src/components/Navbar.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import weblogo from "../images/weblogo.png";
import userIcon from "../images/usericon.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // อ่าน user จาก localStorage ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("parse user error", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isLoginPage = location.pathname === "/login";
  const isAuthPage =
    isLoginPage || location.pathname === "/register";

  return (
    <header className="header">
      <div className="nav-logo">
        <img src={weblogo} alt="Logo" className="logo-img" />
      </div>

      <nav className="nav-menu">
        <Link to="/">Home</Link>
        <Link to="/userhistory">History</Link>
        <Link to="/aboutus">About Us</Link>
      </nav>

      <div className="nav-auth">
        {isAuthPage ? (
          // อยู่หน้า login หรือ register → โชว์ปุ่ม Register/ Login เหมือนเดิม
          <>
            {/* Register = แดงตลอด */}
            <Link
              to="/register"
              className="nav-auth-link nav-auth-register"
            >
              Register
            </Link>

            <span className="nav-auth-sep">|</span>

            {/* Login = ขาวตลอด */}
            <Link
              to="/login"
              className="nav-auth-link"
            >
              Login
            </Link>
          </>
        ) : user ? (
          // ล็อกอินแล้ว → แสดงชื่อ + logout
          <div className="nav-user-wrapper">
            <img src={userIcon} alt="User" className="nav-user-icon" />
            <Link to="/userinfo" className="nav-username nav-username-link">
              {user.username}
            </Link>
            <span className="nav-auth-sep">|</span>
            <span className="nav-logout-btn" onClick={handleLogout}>
              Logout
            </span>
          </div>
        ) : (
          // ยังไม่ล็อกอิน + ไม่ได้อยู่หน้า login/register
          <>
            {/* Register = แดงตลอด */}
            <Link
              to="/register"
              className="nav-auth-link nav-auth-register"
            >
              Register
            </Link>

            <span className="nav-auth-sep">|</span>

            {/* Login = ขาวตลอด */}
            <Link to="/login" className="nav-auth-link">
              Login
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;
