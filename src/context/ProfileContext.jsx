import { createContext, useContext, useState } from "react";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  // localStorage keeps values across page refreshes without needing Supabase yet
  const [displayName, setDisplayName] = useState(() => localStorage.getItem("displayName") || "");
  const [jobTitle,    setJobTitle]    = useState(() => localStorage.getItem("jobTitle")    || "");

  function updateProfile(fields) {
    if (fields.displayName !== undefined) {
      setDisplayName(fields.displayName);
      localStorage.setItem("displayName", fields.displayName);
    }
    if (fields.jobTitle !== undefined) {
      setJobTitle(fields.jobTitle);
      localStorage.setItem("jobTitle", fields.jobTitle);
    }
  }

  return (
    <ProfileContext.Provider value={{ displayName, jobTitle, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
