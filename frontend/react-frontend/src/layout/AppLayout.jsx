import { Outlet, Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, useContext } from "react";
import useTheme from "../assets/js/useTheme";
import { logout } from "../assets/js/utils/logout";
import { Helmet } from "react-helmet-async";
import { restoreUserSession } from "../assets/js/utils/adminSession";
import {ProfileContext} from "../context/profile-context";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../assets/js/api/notificationsApi";

import logoLight from "../assets/images/logo_spartan_scholars.png";
import logoLightText from "../assets/images/text_logo.png";
import logoDark from "../assets/images/dark_mode_logo.png";
import logoDarkText from "../assets/images/dark_mode_text.png";
import ai_icon from "../assets/images/ai_icon.png";

import notes_icon from "../assets/images/notes_icon.png";
import study_group from "../assets/images/study_group_icon.png";
import quiz_icon from "../assets/images/quiz_icon.png";
import discussion_icon from "../assets/images/discussion_icon.png";

import class_planner from "../assets/images/explore_topics_icon.png";
import productivity from "../assets/images/analytics_icon.png";

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const previousPathRef = useRef(location.pathname);
  const settingsMenuContainerRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const notificationMenuContainerRef = useRef(null);
  const notificationMenuRef = useRef(null);
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(localStorage.getItem("sidebarCollapsed") === "true");
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  function closeSettingsMenu() {
    if (settingsMenuRef.current) {
      settingsMenuRef.current.open = false;
    }
  }

  function closeNotificationMenu() {
    if (notificationMenuRef.current) {
      notificationMenuRef.current.open = false;
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
    closeNotificationMenu();
  }, [isAdminRoute, location.pathname]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const data = await fetchNotifications();
        if (!cancelled) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    }

    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!settingsMenuContainerRef.current?.contains(event.target)) {
        closeSettingsMenu();
      }
      if (!notificationMenuContainerRef.current?.contains(event.target)) {
        closeNotificationMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  async function handleNotificationsToggle() {
    const willOpen = !notificationMenuRef.current?.open;
    if (!willOpen) {
      return;
    }
    try {
      const data = await fetchNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {}
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
  }

  async function handleNotificationClick(item) {
    if (!item.read) {
      await markNotificationRead(item.id);
      setNotifications((current) =>
        current.map((entry) => (entry.id === item.id ? { ...entry, read: true } : entry))
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }
    closeNotificationMenu();
    if (item.href) {
      navigate(item.href);
    }
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
          <div ref={notificationMenuContainerRef}>
            <details className="notificationMenu" ref={notificationMenuRef}>
              <summary className="notificationMenu__trigger" aria-label="Open notifications" onClick={handleNotificationsToggle}>
                <span className="notificationMenu__icon" aria-hidden="true">🔔</span>
                {unreadCount > 0 && <span className="notificationMenu__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </summary>

              <div className="notificationMenu__panel">
                <div className="notificationMenu__header">
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <button type="button" className="notificationMenu__markAll" onClick={handleMarkAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="notificationMenu__list">
                  {notifications.length === 0 ? (
                    <p className="notificationMenu__empty">No notifications yet.</p>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`notificationMenu__item ${item.read ? "" : "notificationMenu__item--unread"}`}
                        onClick={() => handleNotificationClick(item)}
                      >
                        <strong>{item.title}</strong>
                        <span>{item.message}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </details>
          </div>

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
              <span className="askAiBtn__icon">
                <img 
                  src={ai_icon}
                  alt="AI Icon"
                />
              </span>
            <span className="askAiBtn__label"> Ask AI </span>
          </Link>

          <hr className="sidebar__divider" />

          <nav className="nav">
            <NavLink to="/notes" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              <span className="nav__icon">
                <img src={notes_icon} alt=""/>
              </span>
              <span className="nav__label"> My Notes </span>
            </NavLink>

            <NavLink to="/study-groups" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              <span className = "nav__icon">
                <img src={study_group} alt="Study Group Icon"/>
              </span>
              <span className="nav__label"> Study Groups </span>
            </NavLink>

            <NavLink to="/take-quizzes" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              <span className= "nav__icon">
                <img src={quiz_icon} alt="Quizzes"/>
              </span>
              <span className="nav__label"> Take Quizzes </span>
            </NavLink>

            <NavLink to="/UNCG-Planner" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              <span className="nav__icon">
                <img src={class_planner} alt="Planner"/>
              </span>
              <span className="nav__label"> UNCG Planner </span>
            </NavLink>

            <NavLink to="/public-notes" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              <span className="nav__icon">
                <img src={discussion_icon} alt="Discussion"/>
              </span>
              <span className="nav__label"> Public Notes </span>
            </NavLink>

            <NavLink to="/Productivity-Hub" className={({ isActive }) => "nav__item" + (isActive ? " nav__item--active" : "")}>
              <span className="nav__icon">
                <img src={productivity} alt="Productivity Hub"/>
              </span>
              <span className="nav__label"> Productivity Hub </span>
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
