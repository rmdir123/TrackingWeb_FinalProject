// src/components/Navbar.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import weblogo from "../images/weblogo.png";
import userIcon from "../images/usericon.png";

function Navbar() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true); // ตรวจสอบ token อยู่
  const navigate = useNavigate();
  const location = useLocation();

  // ⭐ ตรวจสอบ token แบบ "ทางการ" ด้วยการยิงไปถาม backend
  const verifyToken = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      setChecking(false);
      return;
    }

    try {
      const res = await fetch("http://43.209.65.64:5000/api/v1/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // ❌ token หมดอายุ / ใช้ไม่ได้
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      } else {
        // ✔ token ใช้ได้
        const data = await res.json();

        // รองรับทั้งกรณี backend ส่ง { user: {...} } กับ {...} ตรง ๆ
        const cleanedUser = data.user ? data.user : data;

        setUser(cleanedUser);
        localStorage.setItem("user", JSON.stringify(cleanedUser));
      }
    } catch (err) {
      console.error("verify token error:", err);
      setUser(null);
    }

    setChecking(false);
  };

  // ⭐ รัน verifyToken ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    verifyToken();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  const homePath = user
  ? user.role === "admin"
    ? "/admin_home"
    : user.role === "system_manager"
    ? "/manager_home"
    : "/user_home"
  : "/";


  return (
    <header className="header">
      <div className="nav-logo">
        <img src={weblogo} alt="Logo" className="logo-img" />
      </div>

      <nav className="nav-menu">
        <Link to={homePath}>Home</Link>
        <Link to="/userhistory">History</Link>
        <Link to="/aboutus">About Us</Link>
      </nav>

      <div className="nav-auth">
        {/* ระหว่างตรวจสอบ token ยังไม่แสดงอะไร */}
        {checking ? null : isAuthPage ? (
          <>
            <Link to="/register" className="nav-auth-link nav-auth-register">
              Register
            </Link>
            <span className="nav-auth-sep">|</span>
            <Link to="/login" className="nav-auth-link">
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
            <Link to="/register" className="nav-auth-link nav-auth-register">
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
