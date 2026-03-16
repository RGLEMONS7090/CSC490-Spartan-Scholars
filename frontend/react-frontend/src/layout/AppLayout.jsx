import { Outlet, Link, NavLink } from "react-router-dom";
import {useState} from "react";
import useTheme from "../assets/js/useTheme";
import {logout} from "../assets/js/utils/logout";
import {Helmet} from "react-helmet-async";

//Import images
import logoLight from "../assets/images/logo_spartan_scholars.png";
import logoLightText from "../assets/images/text_logo.png";
import logoDark from "../assets/images/dark_mode_logo.png";
import logoDarkText from "../assets/images/dark_mode_text.png";

export default function AppLayout() {
  //Using theme
  const {theme, toggleTheme} = useTheme();
  // Function for Sidebar
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true");

  function toggleSidebar() {
    const newValue = !collapsed;
    setCollapsed(newValue);
    localStorage.setItem("sidebarCollapsed", newValue);
  };

  return (
    <>
      <Helmet>
        <title> Dashboard </title>
      </Helmet>

    {/* Sidebar Button */}
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
              <img
                className="brand__logo brand__logo--light"
                src={logoLight}
                alt="Spartan Scholars Logo"
              />
              <img
                className="brand__logo brand__logo--dark"
                src={logoDark}
                alt="Spartan Scholars Logo"
              />
            </div>

            <div className="brand__name">
              <img
                className="brand__wordmark brand__wordmark--light"
                src={logoLightText}
                alt="Spartan Scholars"
              />
              <img
                className="brand__wordmark brand__wordmark--dark"
                src={logoDarkText}
                alt="Spartan Scholars"
              />
            </div>
          </Link>
        </div>

        <div className="topbar__right">
          {/* Theme Button */}
          <button 
            className="iconBtn" 
            type="button"
            aria-label="Switch theme"
            onClick={toggleTheme}>
              {theme == "dark" ? "☀" : "☽" }
          </button>

            {/*Logout Button */}
          <button 
            className="logoutBtn" 
            type="button"
            onClick={logout}>
                Logout
          </button>

          <Link className="profileBtn" to="/profile">
            <span className="profileBtn__icon">P</span>
            <span className="profileBtn__text">Profile</span>
          </Link>
        </div>
      </header>

      {/* Sidebar and Main Layout */}
      <div id="appShell" className={`shell ${collapsed ? "shell--collapsed" : ""}`}>
        <aside id="appSidebar" className="sidebar">

          <Link className="askAiBtn" to="/ai-assistant">
            <span className="askAiBtn__spark">*</span>
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
