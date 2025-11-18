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
  const isRegisterPage = location.pathname === "/register";
  const isAuthPage = isLoginPage || isRegisterPage;

  return (
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
        {/* ถ้าเป็นหน้า login/register → บังคับให้โชว์ Register/Login ตลอด */}
        {isAuthPage ? (
          <>
            <Link
              to="/register"
              className={`nav-auth-link ${
                isRegisterPage ? "nav-auth-active" : ""
              }`}
            >
              Register
            </Link>
            <span className="nav-auth-sep">|</span>
            <Link
              to="/login"
              className={`nav-auth-link ${
                isLoginPage ? "nav-auth-active" : ""
              }`}
            >
              Login
            </Link>
          </>
        ) : user ? (
          // หน้าอื่น + มี user (ล็อกอินอยู่) → โชว์ icon + username + | + logout
          <div className="nav-user-wrapper">
            <img src={userIcon} alt="User" className="nav-user-icon" />
            <span className="nav-username">{user.username}</span>
            <span className="nav-auth-sep">|</span>
            <span className="nav-logout-btn" onClick={handleLogout}>
              Logout
            </span>
          </div>
        ) : (
          // หน้าอื่น + ยังไม่ล็อกอิน → โชว์ Register / Login
          <>
            <Link to="/register" className="nav-auth-link">
              Register
            </Link>
            <span className="nav-auth-sep">|</span>
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
