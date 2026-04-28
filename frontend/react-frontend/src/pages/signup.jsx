import { Link, useNavigate } from "react-router-dom";
import {useState, useContext} from "react";
import {Helmet} from "react-helmet-async";
import useTheme from "../assets/js/useTheme";
import { clearAdminSessionArtifacts } from "../assets/js/utils/adminSession";
import {ProfileContext} from "../context/profile-context";

//Import images
import logoLight from "../assets/images/logo_spartan_scholars.png";
import logoLightText from "../assets/images/text_logo.png";
import logoDark from "../assets/images/dark_mode_logo.png";
import logoDarkText from "../assets/images/dark_mode_text.png";

export default function Signup() {
  const navigate = useNavigate();
  //Using theme
  const {theme, toggleTheme} = useTheme();

  // For form fields
  const [name, setName] = useState("");
  const[email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const[error, setError] = useState("");

  const {setProfile} = useContext(ProfileContext);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        setError("Signup failed. Email may already be in use.");
        return;
      }

      const data = await response.json();
      clearAdminSessionArtifacts();
      localStorage.setItem("token", data.token);
      setProfile(data.user);

      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    }
  }

  return (
    <>
      <Helmet>
        <title> Signup </title>
      </Helmet>

      <main className="authPage authPage__layout authPage__layout--reverse">
        {/* Left Side - Signup */}
        <section className="authCardWrap">
        <div className="authCard card shadow">
          <h2 className="text-center mb-2">Create Account</h2>
          <p className="authCard__subtitle text-center mb-4">
            Set up your Spartan Scholars profile.
          </p>

          {error && (
            <div className="authMessage authMessage--error" role = "alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <input 
                type = "text"
                className = "form-control"
                id = "name"
                required
                value = {name}
                onChange = {(e) => setName(e.target.value)}
              />
            </div>
            
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
                Sign Up
              </button>

              <p className="text-center mt-3 mb-0">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </form>
          </div>
        </section>


      {/*Right Side - Explain*/}
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

          <p className="authHero__eyebrow">Build your academic profile</p>
          <h1 className="authHero__title">
            Create your account and start collaborating.
          </h1>
          <p className="authHero__copy">
            Join notes, discussion spaces, study groups, and quizzes with one
            shared account.
          </p>
        </div>
      </section>

      </main>
    </>
  );
}
