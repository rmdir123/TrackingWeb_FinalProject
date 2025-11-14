// src/App.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";

import AdminHome from "./pages/AdminHome";
import UserHistory from "./pages/UserHistory";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AdminHome />} />
      <Route path="/user_history" element={<UserHistory />} />
    </Routes>
  );
}

export default App;
