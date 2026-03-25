import { useEffect, useState, useContext } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { changePassword, deleteProfile, fetchProfile, updateProfile } from "../assets/js/api/profileApi";

import Cropper from "react-easy-crop";
import {ProfileContext} from "../context/profile-context";

export default function Profile() {
  const navigate = useNavigate();
  //const [profile, setProfile] = useState(null);
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

  const { setProfile } = useContext(ProfileContext);
  const [localProfile, setLocalProfile] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchProfile();
        setProfile(data);
        setLocalProfile(data);
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
      setLocalProfile(updated);
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

   // For profile image
   const avatarUrl = localProfile?.profileImage
   ? `http://localhost:8080${localProfile.profileImage}`
   : `https://ui-avatars.com/api/?name=${encodeURIComponent(
       localProfile?.name || "User")}&background=random&size=128}`;
 
   
   function handleProfileImageUpload(event) {
     const file = event.target.files[0];
     if (!file) return;
   
     setSelectedImage(URL.createObjectURL(file));
     setCropModalOpen(true);
   }
 
   const handleUpload = async () => {
     const token = localStorage.getItem("token");
     const formData = new FormData();
     formData.append("file", selectedFile);
   
     const res = await axios.post(
       "http://localhost:8080/api/profile/image",
       formData,
       {
         headers: {
           Authorization: `Bearer ${token}`,
           "Content-Type": "multipart/form-data"
         }
       }
     );
     setProfile(res.data);
     setLocalProfile(res.data);
    };

    // For popup to crop image
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  
  async function getCroppedImage(imageSrc, cropPixels) {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
  
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
  
    ctx.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height
    );
  
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/jpeg");
    });
  }
  
  function createImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
    });
  }

  async function saveCroppedImage() {
    const croppedBlob = await getCroppedImage(selectedImage, croppedAreaPixels);
  
    const formData = new FormData();
    formData.append("file", croppedBlob, "profile.jpg");
  
    try {
      const token = localStorage.getItem("token");
  
      const res = await fetch("/api/profile/image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
  
      const updated = await res.json();
      setProfile(updated);
      setLocalProfile(updated);
  
      localStorage.setItem("user", JSON.stringify(updated));
  
      setCropModalOpen(false);
    } catch (err) {
      setError(err.message);
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
              <p>Update your display name, change profile image, change your password, or delete your profile.</p>
            </div>
          </div>
        </section>

        {loading ? (
          <p>Loading profile...</p>
        ) : (
          <section className="profilePanel">
            <div className="profileSection">
              <span className="profileSection__label">Email</span>
              <div className="profileSection__value">{localProfile?.email}</div>
            </div>

            <div className="profileSection">
              <span className="profileSection__label">Change Profile Icon</span>
              
              <div className="profilePhotoRow">
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="profilePhotoPreview"
                />

                <button
                  type="button"
                  className="quizActionBtn quizActionBtn--secondary"
                  onClick={() => document.getElementById("profileImageInput").click()}
                >
                Change Photo
                </button>

                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleProfileImageUpload}
                />
              </div>
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

            <section className="profileSection">
              <span className="profileSection__label">Admin View</span>
              <p className="profileSection__help">
                {localProfile?.adminMode
                  ? "Admin view is active for this session."
                  : "Enter the admin password to temporarily access the protected admin view."}
              </p>
              <div className="profileSection__actions">
                <Link className="quizActionBtn quizActionBtn--secondary" to="/profile/admin-access">
                  Become an Admin!
                </Link>
              </div>
            </section>

            {error && <p className="quizError">{error}</p>}
          </section>
        )}

        {/* Modal for Image Icon */}
        {cropModalOpen && (
          <div className="cropperModal">
          <div className="cropperContainer">
            <div className="cropperArea">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(croppedArea, croppedPixels) => {
                  setCroppedAreaPixels(croppedPixels);
                }}
              />
            </div>

            <div className="cropperControls">
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(e.target.value)}
              />

              <div className="cropperButtons">
                <button
                  className="quizActionBtn quizActionBtn--secondary"
                  onClick={() => setCropModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  className="quizActionBtn quizActionBtn--primary"
                  onClick={saveCroppedImage}
                >
                  Save
                </button>
              </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </>
  );
}
