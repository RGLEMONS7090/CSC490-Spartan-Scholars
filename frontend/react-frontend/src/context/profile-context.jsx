import { createContext, useState, useEffect } from "react";
import axios from "axios";
import {fetchProfile} from "../assets/js/api/profileApi";

export const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);

  const token = localStorage.getItem("token");
  useEffect(() => {
    //const token = localStorage.getItem("token");

    //if (!token) return;

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


    //axios.get("http://localhost:8080/api/profile")
      //.then(res => setProfile(res.data))
      //.catch(err => console.error("Failed to load profile:", err));
    //}, []);


    //axios.get("http://localhost:8080/api/profile", {
        //headers: {
          //Authorization: `Bearer ${token}`
        //}
      //})
      //.then(res => setProfile(res.data))
      //.catch(err => console.error("Failed to load profile:", err));
    //}, []);
  
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}