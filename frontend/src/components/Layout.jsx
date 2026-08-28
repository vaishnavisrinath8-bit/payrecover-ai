import React, { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  CreditCard,
  RefreshCcw,
  BarChart3,
  Settings,
  UserCircle,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Bell,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const navigationGroups = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "Payments",
    items: [
      {
        label: "Payments",
        path: "/payments",
        icon: CreditCard,
      },
      {
        label: "Recoveries",
        path: "/recoveries",
        icon: RefreshCcw,
      },
    ],
  },

  {
    title: "Insights",
    items: [
      {
        label: "Analytics",
        path: "/analytics",
        icon: BarChart3,
      },
      {
        label: "Notifications",
        path: "/notifications",
        icon: Bell,
      },
    ],
  },

  {
    title: "System",
    items: [
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
    ],
  },
];

function getInitials(name) {
  if (!name) return "PR";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getPageName(pathname) {
  if (
    pathname === "/" ||
    pathname === "/dashboard"
  ) {
    return "Dashboard";
  }

  const names = {
    "/payments": "Payments",
    "/recoveries": "Recoveries",
    "/analytics": "Analytics",
    "/notifications": "Notifications",
    "/account": "Account",
    "/settings": "Settings",
  };

  return names[pathname] || "Dashboard";
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const userName =
    localStorage.getItem("payrecover_user_name") ||
    "PayRecover Admin";

  const userEmail =
    localStorage.getItem("payrecover_user_email") ||
    "admin@payrecover.ai";

  const initials = getInitials(userName);

  const currentPage = getPageName(location.pathname);

  const handleLogout = () => {
    localStorage.removeItem("payrecover_session");

    setProfileOpen(false);
    setMobileOpen(false);

    navigate("/dashboard");
  };

  const handleNavigation = (path) => {
    setMobileOpen(false);
    setProfileOpen(false);
    navigate(path);
  };

  const isActivePath = (path) => {
    if (path === "/dashboard") {
      return (
        location.pathname === "/" ||
        location.pathname === "/dashboard"
      );
    }

    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-shell">

      {/* MOBILE OVERLAY */}

      {mobileOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          mobileOpen ? "sidebar-open" : ""
        }`}
      >

        {/* BRAND */}

        <div className="sidebar-brand">

          <div className="brand-mark">
            <WalletCards
              size={22}
              strokeWidth={2.4}
            />
          </div>

          <div className="brand-copy">
            <div className="brand-name">
              PayRecover AI
            </div>

            <div className="brand-subtitle">
              Payment Recovery Platform
            </div>
          </div>

          <button
            type="button"
            className="mobile-close-button"
            aria-label="Close navigation"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <X size={20} />
          </button>

        </div>

        {/* NAVIGATION */}

        <div className="sidebar-content">

          {navigationGroups.map((group) => (
            <div
              className="nav-group"
              key={group.title}
            >

              <div className="nav-group-title">
                {group.title}
              </div>

              <nav className="nav-list">

                {group.items.map((item) => {
                  const Icon = item.icon;

                  const active =
                    isActivePath(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`nav-item ${
                        active ? "active" : ""
                      }`}
                      onClick={() => {
                        setMobileOpen(false);
                        setProfileOpen(false);
                      }}
                    >

                      <Icon
                        size={18}
                        strokeWidth={2}
                      />

                      <span>
                        {item.label}
                      </span>

                      {item.label ===
                        "Notifications" && (
                        <span className="nav-notification-dot" />
                      )}

                    </NavLink>
                  );
                })}

              </nav>

            </div>
          ))}

        </div>

        {/* SIDEBAR FOOTER */}

        <div className="sidebar-footer">

          <div className="security-card">

            <div className="security-icon">
              <ShieldCheck size={17} />
            </div>

            <div>
              <strong>
                Platform protected
              </strong>

              <span>
                Secure payment operations
              </span>
            </div>

          </div>

          <div className="sidebar-profile">

            <div className="profile-avatar">
              {initials}
            </div>

            <div className="profile-info">

              <strong>
                {userName}
              </strong>

              <span>
                {userEmail}
              </span>

            </div>

            <button
              type="button"
              className="profile-more"
              aria-label="Open profile menu"
              onClick={() =>
                setProfileOpen(
                  (current) => !current
                )
              }
            >
              <ChevronDown size={17} />
            </button>

          </div>

        </div>

      </aside>

      {/* MAIN */}

      <div className="main-shell">

        {/* TOPBAR */}

        <header className="topbar">

          <div className="topbar-left">

            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Open navigation"
              onClick={() =>
                setMobileOpen(true)
              }
            >
              <Menu size={21} />
            </button>

            <div className="breadcrumb">

              <span>
                PayRecover AI
              </span>

              <span className="breadcrumb-separator">
                /
              </span>

              <strong>
                {currentPage}
              </strong>

            </div>

          </div>

          {/* TOPBAR ACTIONS */}

          <div className="topbar-actions">

            {/* NOTIFICATIONS */}

            <button
              type="button"
              className="icon-button notification-button"
              aria-label="Open notifications"
              onClick={() =>
                handleNavigation(
                  "/notifications"
                )
              }
            >

              <Bell size={19} />

              <span className="notification-dot" />

            </button>

            {/* PROFILE */}

            <div className="profile-menu-wrapper">

              <button
                type="button"
                className="topbar-profile"
                onClick={() =>
                  setProfileOpen(
                    (current) => !current
                  )
                }
              >

                <div className="profile-avatar small">
                  {initials}
                </div>

                <div className="topbar-profile-text">

                  <strong>
                    {userName}
                  </strong>

                  <span>
                    Administrator
                  </span>

                </div>

                <ChevronDown size={16} />

              </button>

              {/* PROFILE DROPDOWN */}

              {profileOpen && (
                <div className="profile-dropdown">

                  <div className="dropdown-header">

                    <div className="profile-avatar">
                      {initials}
                    </div>

                    <div>

                      <strong>
                        {userName}
                      </strong>

                      <span>
                        {userEmail}
                      </span>

                    </div>

                  </div>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() =>
                      handleNavigation(
                        "/account"
                      )
                    }
                  >

                    <UserCircle size={17} />

                    <span>
                      Account
                    </span>

                  </button>

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={() =>
                      handleNavigation(
                        "/settings"
                      )
                    }
                  >

                    <Settings size={17} />

                    <span>
                      Settings
                    </span>

                  </button>

                  <div className="dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-item danger"
                    onClick={handleLogout}
                  >

                    <LogOut size={17} />

                    <span>
                      Logout
                    </span>

                  </button>

                </div>
              )}

            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="page-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}