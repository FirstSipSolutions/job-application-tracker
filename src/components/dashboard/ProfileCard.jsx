import { useProfile } from "../../context/ProfileContext.jsx";
import HireHub from "./HireHub.jsx";

export default function ProfileCard() {
  const { displayName, jobTitle } = useProfile();
  const initial = displayName ? displayName[0].toUpperCase() : "?";

  return (
    <div className="db-card db-profile">
      <div className="db-avatar">{initial}</div>
      <div className="db-profile-name">{displayName || "Your Name"}</div>
      <div className="db-profile-role">{jobTitle || "Your Role"}</div>
      <HireHub />
    </div>
  );
}
