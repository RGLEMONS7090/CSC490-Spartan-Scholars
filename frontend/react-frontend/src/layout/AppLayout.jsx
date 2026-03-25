import { Outlet, Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useContext } from "react";
import useTheme from "../assets/js/useTheme";
import { logout } from "../assets/js/utils/logout";
import { Helmet } from "react-helmet-async";
import { restoreUserSession } from "../assets/js/utils/adminSession";
import axios from "axios";
import {ProfileContext} from "../context/profile-context";

import logoLight from "../assets/images/logo_spartan_scholars.png";
import logoLightText from "../assets/images/text_logo.png";
import logoDark from "../assets/images/dark_mode_logo.png";
import logoDarkText from "../assets/images/dark_mode_text.png";
import ai_icon from "../assets/images/ai_icon.png";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const previousPathRef = useRef(location.pathname);
  const settingsMenuContainerRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(localStorage.getItem("sidebarCollapsed") === "true");

  function closeSettingsMenu() {
    if (settingsMenuRef.current) {
      settingsMenuRef.current.open = false;
    }
  }

  function toggleSidebar() {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem("sidebarCollapsed", newValue);
  }

  function leaveAdminView() {
    restoreUserSession();
    closeSettingsMenu();
    navigate("/profile");
  }

  function handleThemeToggle() {
    toggleTheme();
  }

  function handleLogout() {
    closeSettingsMenu();
    logout();
  }

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const wasAdminRoute = previousPath.startsWith("/admin");
    if (wasAdminRoute && !isAdminRoute) {
      restoreUserSession();
    }
    previousPathRef.current = location.pathname;
    closeSettingsMenu();
  }, [isAdminRoute, location.pathname]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!settingsMenuContainerRef.current?.contains(event.target)) {
        closeSettingsMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  const token = localStorage.getItem("token");
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

  const { profile } = useContext(ProfileContext);

  //if (!profile){
    //return <div />;
  //}

  const avatarUrl = profile?.profileImage
  ? `http://localhost:8080${profile.profileImage}`
  : `https://ui-avatars.com/api/?name=${encodeURIComponent(
    profile?.name || "User"
  )}&background=random&size=128`;
  

  return (
    <>
      <Helmet>
        <title>Dashboard</title>
      </Helmet>

      <header className="topbar">
        <div className="topbar__left">
          <button
            id="sidebarToggle"
            className="topbarToggleBtn"
            type="button"
            aria-label="Toggle sidebar"
            onClick={toggleSidebar}
          >
            ☰
          </button>

          <Link className="brand brand--link" to="/">
            <div className="brand__icon">
              <img className="brand__logo brand__logo--light" src={logoLight} alt="Spartan Scholars Logo" />
              <img className="brand__logo brand__logo--dark" src={logoDark} alt="Spartan Scholars Logo" />
            </div>

            <div className="brand__name">
              <img className="brand__wordmark brand__wordmark--light" src={logoLightText} alt="Spartan Scholars" />
              <img className="brand__wordmark brand__wordmark--dark" src={logoDarkText} alt="Spartan Scholars" />
            </div>
          </Link>
        </div>

        <div className="topbar__right">
          <div ref={settingsMenuContainerRef}>
          <details className="settingsMenu" ref={settingsMenuRef}>
            <summary className="settingsMenu__trigger" aria-label="Open settings menu">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="settingsMenu__avatar" />
                <span className="settingsMenu__name">{profile?.name || "Profile"}</span>
            </summary>

            <div className="settingsMenu__panel">
              <Link className="settingsMenu__item" to="/profile" onClick={closeSettingsMenu}>
                Profile
              </Link>

              {isAdminRoute && (
                <button className="settingsMenu__item" type="button" onClick={leaveAdminView}>
                  Leave Admin View
                </button>
              )}

              <button className="settingsMenu__item settingsMenu__item--danger" type="button" onClick={handleLogout}>
                Logout
              </button>

              <button
                className="settingsMenu__themeToggle"
                type="button"
                onClick={handleThemeToggle}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                <span className="settingsMenu__themeIcon" aria-hidden="true">☀</span>
                <span
                  className={`settingsMenu__switch ${theme === "dark" ? "settingsMenu__switch--active" : ""}`}
                  aria-hidden="true"
                >
                  <span className="settingsMenu__switchThumb"></span>
                </span>
                <span className="settingsMenu__themeIcon" aria-hidden="true">☾</span>
              </button>
            </div>
          </details>
          </div>
        </div>
      </header>

      <div id="appShell" className={`shell ${collapsed ? "shell--collapsed" : ""}`}>
        <aside id="appSidebar" className="sidebar">
          <Link className="askAiBtn" to="/ai-assistant">
            <span className="askAiBtn__spark">
              <img 
                src={ai_icon}
                alt="AI Icon"
              />
            </span>
            Ask AI
          </Link>

          <hr className="sidebar__divider" />

          <nav className="nav">
            <NavLink to="/notes" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              My Notes
            </NavLink>

            <NavLink to="/study-groups" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              Study Groups
            </NavLink>

            <NavLink to="/take-quizzes" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              Take Quizzes
            </NavLink>

            <NavLink to="/explore-topics" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              Explore Topics
            </NavLink>

            <NavLink to="/discussion-board" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              Discussion Board
            </NavLink>

            <NavLink to="/analytics" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              View Analytics
            </NavLink>
          </nav>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </>
  );
}
