
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import Recoveries from "./pages/Recoveries";
import Analytics from "./pages/Analytics";
import Notifications from "./pages/Notifications";
import Account from "./pages/Account";
import Settings from "./pages/Settings";
import PaymentDetails from "./pages/PaymentDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />

        <Route path="payments" element={<Payments />} />

        <Route
          path="payments/:id"
          element={<PaymentDetails />}
        />

        <Route path="recoveries" element={<Recoveries />} />

        <Route path="analytics" element={<Analytics />} />

        <Route
          path="notifications"
          element={<Notifications />}
        />

        <Route path="account" element={<Account />} />

        <Route path="settings" element={<Settings />} />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Route>
    </Routes>
  );
}

export default App;

