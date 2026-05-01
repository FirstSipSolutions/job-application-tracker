import { useTheme } from "../../context/ThemeContext.jsx";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      className={`tt-track ${isDark ? "tt-dark" : "tt-light"}`}
      onClick={toggle}
      aria-label="Toggle theme"
    >
      <span className="tt-knob">{isDark ? "☾" : "☀"}</span>
    </button>
  );
}
