// src/components/Navbar.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import weblogo from "../images/weblogo.png";
import userIcon from "../images/usericon.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  // 👇 ตรงนี้คือ logic เลือกหน้า Home ตาม role
  const homePath = user
    ? user.role === "admin"   // ปรับ 'admin' ให้ตรงกับค่าจริงใน token ถ้าไม่เหมือน
      ? "/admin_home"
      : "/user_home"
    : "/";

  return (
    <header className="header">
      <div className="nav-logo">
        <img src={weblogo} alt="Logo" className="logo-img" />
      </div>

      <nav className="nav-menu">
        {/* ใช้ homePath แทน / */}
        <Link to={homePath}>Home</Link>
        <Link to="/userhistory">History</Link>
        <Link to="/aboutus">About Us</Link>
      </nav>

      <div className="nav-auth">
        {isAuthPage ? (
          <>
            <Link
              to="/register"
              className="nav-auth-link nav-auth-register"
            >
              Register
            </Link>
            <span className="nav-auth-sep">|</span>
            <Link
              to="/login"
              className="nav-auth-link"
            >
              Login
            </Link>
          </>
        ) : user ? (
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
          <>
            <Link
              to="/register"
              className="nav-auth-link nav-auth-register"
            >
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
