// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

import AdminHome from "./pages/AdminHome";
import UserHistory from "./pages/UserHistory";
import UserRegister from "./pages/UserRegister";
import UserLogin from "./pages/UserLogin";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminHome />} />
      <Route path="/user_history" element={<UserHistory />} />
      <Route path="/register" element={<UserRegister />} />
      <Route path="/login" element={<UserLogin />} />
    </Routes>
  );
}

export default App;
