import "../../styles/app-layout.css";
import ThemeToggle from "../ui/ThemeToggle.jsx";

export default function AppLayout({
  leftNav,
  rightPanel,
  breadcrumb,
  topBarRight,
  children,
}) {
  return (
    <div className="al-root">
      <aside className="al-sidebar">
        <div className="al-sidebar-brand">
          <span className="al-brand-text">AppTrack</span>
        </div>
        <nav className="al-sidebar-nav">{leftNav}</nav>
        <div className="al-sidebar-footer"></div>
      </aside>

      <div className="al-content-area">
        <header className="al-topbar">
          <div className="al-topbar-left">{breadcrumb}</div>
          <div className="al-topbar-right">
            {topBarRight}
            <ThemeToggle />
          </div>
        </header>

        <div className="al-body">
          <main className="al-main">{children}</main>
          {rightPanel && <aside className="al-right-panel">{rightPanel}</aside>}
        </div>
      </div>
    </div>
  );
}
