import { Link, useNavigate } from "react-router-dom";
import {useState} from "react";
import {Helmet} from "react-helmet-async";
import useTheme from "../assets/js/useTheme";
import { clearAdminSessionArtifacts } from "../assets/js/utils/adminSession";

import logoLight from "../assets/images/logo_spartan_scholars.png";
import logoLightText from "../assets/images/text_logo.png";
import logoDark from "../assets/images/dark_mode_logo.png";
import logoDarkText from "../assets/images/dark_mode_text.png";

export default function Login() {
  const navigate = useNavigate();
  //Using theme
  const{theme, toggleTheme} = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError("Invalid email or password.");
        return;
      }

      const data = await response.json();
      clearAdminSessionArtifacts();
      localStorage.setItem("token", data.token);

      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    }
  }

  return (
    <>
      <Helmet>
        <title> Login </title>
      </Helmet>
      
      <main className="authPage authPage__layout">
        {/*Left Side - Explain */}
        <section className="authHero">
        <div className="authHero__panel">
          <Link
            className="brand brand--link authHero__brand"
            to="/"
            aria-label="Go to Spartan Scholars home"
          >
            <div className="brand__icon">
              <img
                className="brand__logo brand__logo--light"
                src={logoLight}
                alt="Spartan Scholars logo"
              />
              <img
                className="brand__logo brand__logo--dark"
                src={logoDark}
                alt="Spartan Scholars logo"
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

          <button
            className="iconBtn authThemeToggle"
            type="button"
            data-theme-toggle=""
            aria-label="Switch to dark mode"
            onClick={toggleTheme}>
              {theme === "dark" ? "☀" : "☽" }
          </button>

          <p className="authHero__eyebrow">Academic community platform</p>
          <h1 className="authHero__title">
            Welcome back to your study space.
          </h1>
          <p className="authHero__copy">
            Sign in to continue to notes, discussions, quizzes, and study groups
            without losing your place.
          </p>
        </div>
      </section>

      {/*Right Side - Login */}
      <section className="authCardWrap">
        <div className="authCard card shadow">
          <h2 className="text-center mb-2">Welcome Back</h2>
          <p className="authCard__subtitle text-center mb-4">
            Use your Spartan Scholars account to continue.
          </p>

          {error && (
              <div className="authMessage authMessage--error" role="alert">
                {error}
              </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                type="email"
                className="form-control"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mb-3">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>

            <p className="text-center mt-3 mb-0">
              Don’t have an account? <Link to="/signup">Sign up</Link>
            </p>
          </form>
        </div>
      </section>
      </main>
    </>
  );
}
