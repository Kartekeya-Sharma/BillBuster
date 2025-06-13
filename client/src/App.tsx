import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Reminders from "./pages/Reminders";
import ScanBill from "./pages/ScanBill";
import Landing from "./pages/Landing";
import Profile from "./pages/Profile";
import BalanceTracker from "./pages/BalanceTracker";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/scan" element={<ScanBill />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/balance" element={<BalanceTracker />} />
      </Routes>
    </Router>
  );
}

export default App;
