
import React, { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  CreditCard,
  RotateCcw,
  BarChart3,
  Bell,
  UserCircle,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  LogOut,
  CircleHelp,
  Sparkles,
  ShieldCheck,
  Activity,
  Command,
} from "lucide-react";

import {
  searchPayments,
  searchRecoveries,
} from "../services/api";

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const primaryNavigation = [
    {
      label: "Overview",
      path: "/dashboard",
      icon: LayoutDashboard,
      description: "Business overview",
    },
    {
      label: "Payments",
      path: "/payments",
      icon: CreditCard,
      description: "Payment activity",
    },
    {
      label: "Recoveries",
      path: "/recoveries",
      icon: RotateCcw,
      description: "Revenue recovery",
    },
    {
      label: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      description: "Performance insights",
    },
  ];

  const secondaryNavigation = [
    {
      label: "Notifications",
      path: "/notifications",
      icon: Bell,
    },
    {
      label: "Account",
      path: "/account",
      icon: UserCircle,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const getPageTitle = () => {
    if (location.pathname.startsWith("/payments/")) {
      return "Payment Details";
    }

    const allItems = [
      ...primaryNavigation,
      ...secondaryNavigation,
    ];

    const current = allItems.find(
      (item) =>
        location.pathname === item.path ||
        location.pathname.startsWith(`${item.path}/`)
    );

    return current?.label || "Overview";
  };

  useEffect(() => {
    const value = searchValue.trim();

    if (!value) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);

        const [paymentsResult, recoveriesResult] =
          await Promise.allSettled([
            searchPayments(value),
            searchRecoveries(value),
          ]);

        const results = [];

        if (paymentsResult.status === "fulfilled") {
          const data = Array.isArray(paymentsResult.value)
            ? paymentsResult.value
            : paymentsResult.value?.data || [];

          data.slice(0, 5).forEach((payment) => {
            results.push({
              type: "Payment",
              title:
                payment.customerName ||
                payment.razorpayPaymentId ||
                "Payment",
              subtitle:
                payment.razorpayPaymentId ||
                payment.customerEmail ||
                "",
              path: payment._id
                ? `/payments/${payment._id}`
                : "/payments",
            });
          });
        }

        if (recoveriesResult.status === "fulfilled") {
          const data = Array.isArray(recoveriesResult.value)
            ? recoveriesResult.value
            : recoveriesResult.value?.data || [];

          data.slice(0, 5).forEach((recovery) => {
            results.push({
              type: "Recovery",
              title:
                recovery.customerName ||
                "Recovery case",
              subtitle:
                recovery.customerEmail ||
                recovery.failureReason ||
                "",
              path: "/recoveries",
            });
          });
        }

        setSearchResults(results.slice(0, 8));
      } catch (error) {
        console.error("Global search error:", error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleSearchResult = (result) => {
    setSearchValue("");
    setSearchResults([]);
    setSearchOpen(false);
    navigate(result.path);
  };

  return (
    <div className="app-shell">
      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`app-sidebar ${
          sidebarOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        {/* BRAND */}
        <div className="sidebar-brand">
          <div className="brand-mark">
            <div className="brand-mark-inner">
              PR
            </div>
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              PayRecover
            </div>

            <div className="brand-subtitle">
              AI Revenue Recovery
            </div>
          </div>

          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* WORKSPACE BADGE */}
        <div className="workspace-selector">
          <div className="workspace-avatar">
            P
          </div>

          <div className="workspace-info">
            <span className="workspace-label">
              Workspace
            </span>

            <strong>
              PayRecover Demo
            </strong>
          </div>

          <ChevronDown size={15} />
        </div>

        {/* PRIMARY NAVIGATION */}
        <div className="sidebar-content">
          <div className="sidebar-section">
            <div className="sidebar-section-heading">
              <span>WORKSPACE</span>
            </div>

            <nav className="sidebar-nav">
              {primaryNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() =>
                      setSidebarOpen(false)
                    }
                    className={({ isActive }) =>
                      `sidebar-link ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <span className="sidebar-link-icon">
                      <Icon
                        size={18}
                        strokeWidth={2}
                      />
                    </span>

                    <span className="sidebar-link-content">
                      <span className="sidebar-link-label">
                        {item.label}
                      </span>

                      <span className="sidebar-link-description">
                        {item.description}
                      </span>
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* MANAGEMENT */}
          <div className="sidebar-section sidebar-management">
            <div className="sidebar-section-heading">
              <span>MANAGEMENT</span>
            </div>

            <nav className="sidebar-nav">
              {secondaryNavigation.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() =>
                      setSidebarOpen(false)
                    }
                    className={({ isActive }) =>
                      `sidebar-link compact ${
                        isActive ? "active" : ""
                      }`
                    }
                  >
                    <span className="sidebar-link-icon">
                      <Icon
                        size={18}
                        strokeWidth={2}
                      />
                    </span>

                    <span className="sidebar-link-content">
                      <span className="sidebar-link-label">
                        {item.label}
                      </span>
                    </span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* AI STATUS CARD */}
        <div className="ai-status-card">
          <div className="ai-status-top">
            <div className="ai-status-icon">
              <Sparkles size={16} />
            </div>

            <div className="ai-status-title">
              AI Recovery Engine
            </div>

            <span className="ai-live-dot" />
          </div>

          <div className="ai-status-message">
            Automated recovery workflows are
            operational.
          </div>

          <div className="ai-status-metrics">
            <div>
              <Activity size={13} />
              <span>Operational</span>
            </div>

            <div>
              <ShieldCheck size={13} />
              <span>Protected</span>
            </div>
          </div>
        </div>

        {/* SIDEBAR FOOTER */}
        <div className="sidebar-footer">
          <div className="sidebar-footer-icon">
            <CircleHelp size={17} />
          </div>

          <div className="sidebar-footer-content">
            <strong>Need help?</strong>
            <span>View documentation</span>
          </div>

          <ChevronDown
            size={14}
            className="sidebar-footer-chevron"
          />
        </div>
      </aside>

      {/* =====================================================
          MAIN APPLICATION
      ====================================================== */}
      <main className="app-main">
        {/* TOP HEADER */}
        <header className="app-header">
          <div className="header-left">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div className="header-breadcrumb">
              <span className="breadcrumb-muted">
                PayRecover
              </span>

              <span className="breadcrumb-divider">
                /
              </span>

              <strong>
                {getPageTitle()}
              </strong>
            </div>
          </div>

          <div className="header-actions">
            {/* GLOBAL SEARCH */}
            <div className="global-search-wrapper">
              <button
                type="button"
                className={`header-icon-btn ${
                  searchOpen ? "active" : ""
                }`}
                onClick={() =>
                  setSearchOpen((value) => !value)
                }
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {searchOpen && (
                <div className="global-search-panel">
                  <div className="search-panel-header">
                    <div className="search-input-wrapper">
                      <Search size={17} />

                      <input
                        autoFocus
                        type="text"
                        placeholder="Search payments, customers..."
                        value={searchValue}
                        onChange={(event) =>
                          setSearchValue(
                            event.target.value
                          )
                        }
                      />

                      <span className="search-shortcut">
                        <Command size={11} />
                        K
                      </span>
                    </div>
                  </div>

                  {searchValue && (
                    <div className="search-results">
                      {searching ? (
                        <div className="search-state">
                          Searching...
                        </div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map(
                          (result, index) => (
                            <button
                              type="button"
                              key={`${result.type}-${index}`}
                              className="search-result"
                              onClick={() =>
                                handleSearchResult(
                                  result
                                )
                              }
                            >
                              <div className="search-result-icon">
                                {result.type ===
                                "Payment" ? (
                                  <CreditCard
                                    size={16}
                                  />
                                ) : (
                                  <RotateCcw
                                    size={16}
                                  />
                                )}
                              </div>

                              <div className="search-result-content">
                                <strong>
                                  {result.title}
                                </strong>

                                <span>
                                  {result.subtitle}
                                </span>
                              </div>

                              <span className="search-result-type">
                                {result.type}
                              </span>
                            </button>
                          )
                        )
                      ) : (
                        <div className="search-state">
                          No matching records found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* NOTIFICATIONS */}
            <button
              type="button"
              className="header-icon-btn notification-button"
              onClick={() =>
                navigate("/notifications")
              }
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="notification-dot" />
            </button>

            <div className="header-divider" />

            {/* PROFILE */}
            <div className="profile-wrapper">
              <button
                type="button"
                className="profile-button"
                onClick={() =>
                  setProfileOpen((value) => !value)
                }
              >
                <div className="profile-avatar">
                  A
                </div>

                <div className="profile-info">
                  <strong>Admin</strong>
                  <span>Administrator</span>
                </div>

                <ChevronDown
                  size={15}
                  className={
                    profileOpen
                      ? "profile-chevron-open"
                      : ""
                  }
                />
              </button>

              {profileOpen && (
                <div className="profile-menu">
                  <div className="profile-menu-header">
                    <div className="profile-menu-avatar">
                      A
                    </div>

                    <div>
                      <strong>
                        Admin
                      </strong>

                      <span>
                        admin@payrecover.ai
                      </span>
                    </div>
                  </div>

                  <div className="profile-menu-divider" />

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/account");
                    }}
                  >
                    <UserCircle size={17} />
                    Account
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/settings");
                    }}
                  >
                    <Settings size={17} />
                    Settings
                  </button>

                  <div className="profile-menu-divider" />

                  <button
                    type="button"
                    className="logout-option"
                    onClick={() =>
                      setProfileOpen(false)
                    }
                  >
                    <LogOut size={17} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <section className="app-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

export default Layout;

