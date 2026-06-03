import { useState, useEffect, useRef } from "react";
import { Flame, X } from "lucide-react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import FadeContent from "../ui/FadeContent.jsx";
import { useApplications } from "../../hooks/useApplications.js";
import { markApplied } from "../../lib/jobs/companyMemory.js";

const HOT_KEY  = "cv-vault-hot-jobs";
const WINDOW   = 864e5; // 24 hours
const MAX_SHOW = 3;
const POLL_MS  = 30 * 1000;

function loadHotJobs() {
  try {
    const stored = JSON.parse(localStorage.getItem(HOT_KEY) ?? "{}");
    return (stored.jobs ?? []).filter(j => j.postedAt && Date.now() - new Date(j.postedAt) < WINDOW);
  } catch {
    return [];
  }
}

function timeLeft(postedAt) {
  const ms = new Date(postedAt).getTime() + WINDOW - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function UpcomingPanel() {
  const { addApp } = useApplications();
  const [jobs, setJobs]           = useState(loadHotJobs);
  const [dismissed, setDismissed] = useState(() => new Set());
  const wrapRefs = useRef({}); // url -> wrapper DOM node

  useEffect(() => {
    const poll = setInterval(() => setJobs(loadHotJobs()), POLL_MS);
    const tick = setInterval(() => setJobs(j => [...j]), 60 * 1000); // countdown tick
    return () => { clearInterval(poll); clearInterval(tick); };
  }, []);

  const active  = jobs.filter(j => !dismissed.has(j.url));
  const visible = active.slice(0, MAX_SHOW);
  const extra   = active.length - MAX_SHOW;

  function hide(url) {
    const el = wrapRefs.current[url];
    function commit() {
      delete wrapRefs.current[url];
      setDismissed(prev => new Set([...prev, url]));
    }
    if (el) {
      gsap.to(el, { autoAlpha: 0, x: -8, duration: 0.18, ease: "power2.in", onComplete: commit });
    } else {
      commit();
    }
  }

  function open(e, j) {
    e.preventDefault();
    window.open(j.url, "_blank", "noopener,noreferrer");
    markApplied(j.company);
    addApp({
      url:     j.url,
      company: j.company,
      role:    j.title,
      status:  "Viewed",
      date:    new Date().toISOString().slice(0, 10),
      notes:   `Via ${j.source} (New Today)`,
    });
  }

  if (active.length === 0) {
    return <p className="upcoming-empty">No new listings today. Check back soon.</p>;
  }

  return (
    <div className="hot-jobs-list">
      {visible.map((j, i) => {
        const left = timeLeft(j.postedAt);
        return (
          <div key={j.url} ref={el => { wrapRefs.current[j.url] = el; }}>
            <FadeContent delay={i * 70} duration={400} ease="power2.out">
              <a
                href={j.url}
                onClick={e => open(e, j)}
                target="_blank"
                rel="noopener noreferrer"
                className="hot-job-row"
              >
                <button
                  className="hot-job-hide"
                  onClick={e => { e.preventDefault(); e.stopPropagation(); hide(j.url); }}
                  title="Hide"
                >
                  <X size={10} />
                </button>
                <div className="hot-job-body">
                  <span className="hot-job-title">{j.title}</span>
                  <span className="hot-job-company">{j.company}</span>
                </div>
                {left && (
                  <div className="hot-job-timer">
                    <Flame size={11} className="hot-flame" />
                    <span>{left}</span>
                  </div>
                )}
              </a>
            </FadeContent>
          </div>
        );
      })}
      {extra > 0 && (
        <div className="hot-jobs-more">
          <Link to="/jobs">+{extra} more</Link>
        </div>
      )}
    </div>
  );
}
