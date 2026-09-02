import React, {
  useContext,
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  AuthContext,
} from "../context/AuthContext";

import {
  login as loginApi,
} from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const {
    login,
    isAuthenticated,
    loading,
  } = useContext(AuthContext);

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  // ============================================================
  // ALREADY LOGGED IN
  // ============================================================

  useEffect(() => {
    if (
      !loading &&
      isAuthenticated
    ) {
      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    }
  }, [
    loading,
    isAuthenticated,
    navigate,
  ]);

  // ============================================================
  // LOGIN
  // ============================================================

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      setError(
        "Please enter your email."
      );

      return;
    }

    if (!password) {
      setError(
        "Please enter your password."
      );

      return;
    }

    try {
      setSubmitting(true);

      const response =
        await loginApi(
          cleanEmail,
          password
        );

      if (
        !response?.success ||
        !response?.token
      ) {
        throw new Error(
          response?.message ||
            "Login failed."
        );
      }

      const authenticated =
        login(response);

      if (!authenticated) {
        throw new Error(
          "Unable to create login session."
        );
      }

      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      const message =
        err?.response?.data
          ?.message ||
        err?.message ||
        "Unable to login. Please try again.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // LOADING
  // ============================================================

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
        Loading...
      </div>
    );
  }

  // ============================================================
  // PROTECT LOGIN PAGE
  // ============================================================

  if (isAuthenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-header">
          <h1>
            PayRecover AI
          </h1>

          <p>
            Sign in to your recovery
            dashboard
          </p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >
          <div className="form-group">
            <label>
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="Enter your email"
              autoComplete="email"
              disabled={submitting}
            />
          </div>

          <div className="form-group">
            <label>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? "Signing in..."
              : "Sign In"}
          </button>
        </form>

      </div>
    </div>
  );
}