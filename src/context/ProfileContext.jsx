import { createContext, useContext, useState } from "react";
import { loadUserProfile } from "../lib/llm/parseProfile.js";

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  // localStorage keeps values across page refreshes without needing Supabase yet
  const [displayName,    setDisplayName]    = useState(() => localStorage.getItem("displayName")    || "");
  const [jobTitle,       setJobTitle]       = useState(() => localStorage.getItem("jobTitle")       || "");
  const [githubUsername, setGithubUsername] = useState(() => localStorage.getItem("githubUsername") || "");
  const [userProfile,    setUserProfile]    = useState(() => loadUserProfile());

  function updateProfile(fields) {
    if (fields.displayName !== undefined) {
      setDisplayName(fields.displayName);
      localStorage.setItem("displayName", fields.displayName);
    }
    if (fields.jobTitle !== undefined) {
      setJobTitle(fields.jobTitle);
      localStorage.setItem("jobTitle", fields.jobTitle);
    }
    if (fields.githubUsername !== undefined) {
      setGithubUsername(fields.githubUsername);
      localStorage.setItem("githubUsername", fields.githubUsername);
    }
    if (fields.userProfile !== undefined) {
      setUserProfile(fields.userProfile);
    }
  }

  return (
    <ProfileContext.Provider value={{ displayName, jobTitle, githubUsername, userProfile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile() {
  return useContext(ProfileContext);
}
