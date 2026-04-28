import { createContext, useState, useEffect } from "react";
import {fetchProfile} from "../assets/js/api/profileApi";

export const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);

  const token = localStorage.getItem("token");
  useEffect(() => {
    if (!token){
      setProfile(null);
      return;
    }

    fetchProfile()
      .then(data => setProfile(data))
      .catch(err => {
        console.error("Failed to load profile:", err);
        setProfile(null);
      });
  }, [token]);
  
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}
