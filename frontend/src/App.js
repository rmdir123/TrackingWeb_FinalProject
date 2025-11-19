// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

import AdminHome from "./pages/AdminHome";
import UserHistory from "./pages/UserHistory";
import UserRegister from "./pages/UserRegister";
import UserLogin from "./pages/UserLogin";
import TrackPackage from "./pages/TrackPackage";
import UserHome from "./pages/UserHome";
import PackageDetail from "./pages/PackageDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminHome />} />
      <Route path="/user_history" element={<UserHistory />} />
      <Route path="/register" element={<UserRegister />} />
      <Route path="/login" element={<UserLogin />} />
      <Route path="/track" element={<TrackPackage />} />
      <Route path="/track/:id" element={<TrackPackage />} />
      <Route path="/package/:id/detail" element={<PackageDetail />} />
      <Route path="/user_home" element={<UserHome />} />
    </Routes>
  );
}

export default App;
