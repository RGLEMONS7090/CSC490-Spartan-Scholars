import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { changePassword, deleteProfile, fetchProfile, updateProfile } from "../assets/js/api/profileApi";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nameMessage, setNameMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile();
        setProfile(data);
        setDisplayName(data.name || "");
        setError("");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSaveDisplayName(event) {
    event.preventDefault();
    setSavingName(true);
    setError("");
    setNameMessage("");
    try {
      const updated = await updateProfile(displayName);
      setProfile(updated);
      setDisplayName(updated.name || "");
      setNameMessage("Display name updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingName(false);
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    setSavingPassword(true);
    setError("");
    setPasswordMessage("");
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordMessage("Password changed successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteProfile() {
    const confirmed = window.confirm("Are you sure you want to delete your profile?");
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await deleteProfile();
      localStorage.removeItem("token");
      localStorage.removeItem("mockUser");
      navigate("/signup", { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>Profile Settings</title>
      </Helmet>

      <main className="main main--profile">
        <section className="profileHeader">
          <div className="profileHeader__title">
            <div className="profileHeader__icon">P</div>
            <div>
              <h1>Profile Settings</h1>
              <p>Update your display name, change your password, or delete your profile.</p>
            </div>
          </div>
        </section>

        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <section className="profilePanel">
            <div className="profileSection">
              <span className="profileSection__label">Email</span>
              <div className="profileSection__value">{profile?.email}</div>
            </div>

            <form className="profileSection" onSubmit={handleSaveDisplayName}>
              <label className="quizField">
                <span>Display Name</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Enter your display name"
                />
              </label>
              <div className="profileSection__actions">
                <button className="quizActionBtn quizActionBtn--primary" type="submit" disabled={savingName}>
                  {savingName ? "Saving..." : "Save Display Name"}
                </button>
                {nameMessage && <p className="profileSection__message">{nameMessage}</p>}
              </div>
            </form>

            <form className="profileSection" onSubmit={handleChangePassword}>
              <div className="profilePasswordGrid">
                <label className="quizField">
                  <span>Current Password</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                    }
                    placeholder="Enter current password"
                  />
                </label>

                <label className="quizField">
                  <span>New Password</span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                    }
                    placeholder="Enter new password"
                  />
                </label>
              </div>
              <div className="profileSection__actions">
                <button className="quizActionBtn quizActionBtn--secondary" type="submit" disabled={savingPassword}>
                  {savingPassword ? "Changing..." : "Change Password"}
                </button>
                {passwordMessage && <p className="profileSection__message">{passwordMessage}</p>}
              </div>
            </form>

            <section className="profileSection profileSection--danger">
              <span className="profileSection__label">Delete Profile</span>
              <p className="profileSection__help">This permanently removes your account.</p>
              <button
                className="quizActionBtn quizActionBtn--danger"
                type="button"
                onClick={handleDeleteProfile}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Profile"}
              </button>
            </section>

            {error && <p className="quizError">{error}</p>}
          </section>
        )}
      </main>
    </>
  );
}
