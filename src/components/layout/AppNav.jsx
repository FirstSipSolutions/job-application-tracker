import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase.js";
import ThemeToggle from "../ui/ThemeToggle.jsx";
import LogoutModal from "../modals/LogoutModal.jsx";

export default function AppNav({ onAddApp, onAddEvent }) {
  const { pathname }       = useLocation();
  const navigate           = useNavigate();
  const [showLogout, setShowLogout] = useState(false);
  const dragRef = useRef(null);

  useEffect(() => {
    if (!dragRef.current) return;
    const origin = window.location.origin;
    // Tries three LinkedIn title formats, then generic og:title, then h1 fallback.
    // Uses location.href (not window.open) so popup blockers don't interfere.
    const js = `(function(){`
      + `var url=location.href,role='',company='';`
      + `var title=document.title;`
      + `var og=document.querySelector('meta[property="og:title"]');`
      + `var ogT=og?og.getAttribute('content'):'';`
      // LinkedIn public og:title: "Company hiring Role in Location | LinkedIn"
      + `var hm=(ogT||title).match(/^(.+?)\\s+hiring\\s+(.+?)(?:\\s+in\\s+|\\s*[|\\-]|$)/i);`
      + `if(hm){company=hm[1].trim();role=hm[2].trim();}`
      // Standard title: "Role at Company | Site"
      + `if(!role||!company){var am=(title||ogT).match(/^(.+?)\\s+at\\s+(.+?)(?:\\s*[|\\-]|$)/i);`
      + `if(am){if(!role)role=am[1].trim();if(!company)company=am[2].trim();}}`
      // h1 for role + LinkedIn DOM selectors for company as last resort
      + `if(!role){var h=document.querySelector('h1');if(h)role=h.innerText.trim().split('\\n')[0];}`
      + `if(!company){var sels=['.job-details-jobs-unified-top-card__company-name a','.topcard__org-name-link'];`
      + `for(var i=0;i<sels.length;i++){var el=document.querySelector(sels[i]);if(el){company=el.innerText.trim();break;}}}`
      // Known ATS patterns: company slug lives in the URL path after a generic subdomain.
      + `if(!company){`
      + `var gensubs=/^(jobs|apply|boards|careers|work|hire|job)$/i;`
      + `try{var pu=new URL(url),ph=pu.hostname.replace(/^www\\./,''),pp=pu.pathname.split('/').filter(Boolean);`
      + `var psub=ph.split('.').length>2?ph.split('.')[0]:'';`
      + `var genpath=/^(jobs|careers|apply|job|positions|openings|j)$/i;`
      + `var slug=gensubs.test(psub)?pp.find(function(s){return!genpath.test(s);}):psub||ph.split('.')[0];`
      + `if(slug)company=slug.charAt(0).toUpperCase()+slug.slice(1);}catch(e){}}`
      + `if(!role)role=title.split(/[|\\-]/)[0].trim();`
      + `var p=new URLSearchParams({add:'1'});`
      + `if(url)p.set('url',url);if(role)p.set('role',role);if(company)p.set('company',company);`
      + `window.open('${origin}/app?'+p,'_blank');`
      + `})();`;
    dragRef.current.setAttribute("href", "javascript:" + js);
  }, []);

  function active(path) {
    return pathname === path ? " active" : "";
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  return (
    <>
      <nav className="db-nav">
        <Link to="/" className="db-nav-brand">AppTrack</Link>

        <div className="db-nav-links">
          <Link to="/app"          className={`db-nav-link${active("/app")}`}>Dashboard</Link>
          <Link to="/app/jobs"     className={`db-nav-link${active("/app/jobs")}`}>Jobs</Link>
          <Link to="/app/calendar" className={`db-nav-link${active("/app/calendar")}`}>Calendar</Link>
          <Link to="/app/settings" className={`db-nav-link${active("/app/settings")}`}>Settings</Link>
        </div>

        <div className="db-nav-actions">
          {pathname === "/app"          && <button className="db-nav-add"                   onClick={onAddApp}>+ Add Application</button>}
          {pathname === "/app/calendar" && <button className="db-nav-add db-nav-add-green"  onClick={onAddEvent}>+ Add Event</button>}
          {pathname === "/app/settings" && <button className="db-nav-add db-nav-add-red"    onClick={() => setShowLogout(true)}>Log out</button>}
          <a
            ref={dragRef}
            href="#"
            draggable
            title="Drag to bookmarks bar — click on any job page to log it instantly"
            className="db-nav-bookmarklet"
          >
            ⚡ Log This Job
          </a>
          <ThemeToggle />
        </div>
      </nav>

      {showLogout && (
        <LogoutModal onConfirm={logout} onClose={() => setShowLogout(false)} />
      )}
    </>
  );
}
