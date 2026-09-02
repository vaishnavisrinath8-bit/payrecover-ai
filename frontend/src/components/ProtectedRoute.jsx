import React, {
  useContext,
} from "react";

import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  AuthContext,
} from "../context/AuthContext";

export default function ProtectedRoute({
  children,
}) {
  const {
    isAuthenticated,
    loading,
  } = useContext(AuthContext);

  const location =
    useLocation();

  // ------------------------------------------------------------
  // RESTORING SESSION
  // ------------------------------------------------------------

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading PayRecover AI...
      </div>
    );
  }

  // ------------------------------------------------------------
  // NOT AUTHENTICATED
  // ------------------------------------------------------------

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // ------------------------------------------------------------
  // AUTHENTICATED
  // ------------------------------------------------------------

  return children;
}