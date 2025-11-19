// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

import AdminHome from "./pages/AdminHome";
import UserHistory from "./pages/UserHistory";
import UserRegister from "./pages/UserRegister";
import UserLogin from "./pages/UserLogin";
import UserInfo from "./pages/UserInfo";
import ResetPassword from "./pages/ResetPassword";
import AboutUs from "./pages/AboutUs";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminHome />} />
      <Route path="/userhistory" element={<UserHistory />} />
      <Route path="/register" element={<UserRegister />} />
      <Route path="/login" element={<UserLogin />} />
      <Route path="/userinfo" element={<UserInfo />} />
      <Route path="/resetpassword" element={<ResetPassword />} />
      <Route path="/aboutus" element={<AboutUs />} />
    </Routes>
  );
}

export default App;
