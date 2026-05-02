import { useState } from "react";
import { ExternalLink } from "lucide-react";

const BOARDS = [
  { label: "Indeed",    url: "https://indeed.com"        },
  { label: "Glassdoor", url: "https://glassdoor.com"     },
  { label: "Wellfound", url: "https://wellfound.com"     },
  { label: "LinkedIn",  url: "https://linkedin.com/jobs" },
];

function loadCustom() {
  try { return JSON.parse(localStorage.getItem("hire-custom")) || []; }
  catch { return []; }
}

export default function HireHub() {
  const [custom,  setCustom]  = useState(loadCustom);
  const [adding,  setAdding]  = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl,  setNewUrl]  = useState("");

  function saveLink(e) {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;
    const next = [...custom, { label: newName.trim(), url: newUrl.trim() }];
    setCustom(next);
    localStorage.setItem("hire-custom", JSON.stringify(next));
    setNewName(""); setNewUrl(""); setAdding(false);
  }

  function removeLink(i) {
    const next = custom.filter((_, idx) => idx !== i);
    setCustom(next);
    localStorage.setItem("hire-custom", JSON.stringify(next));
  }

  const allChips = [...BOARDS, ...custom];

  return (
    <div className="hire-hub">
      <div className="hire-hub-title">Hire Hub</div>

      <div className="hire-boards">
        {allChips.map(({ label, url }, i) => (
          <div key={i} className="hire-chip-wrap">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hire-board-chip"
              onClick={() => sessionStorage.setItem("job-hunt", "1")}
            >
              {label}
            </a>
            {i >= BOARDS.length && (
              <button className="hire-chip-remove" onClick={() => removeLink(i - BOARDS.length)}>
                x
              </button>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <form onSubmit={saveLink} className="hire-add-form">
          <input className="hire-add-input" placeholder="Name" autoFocus required
            value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="hire-add-input" placeholder="https://..." required
            value={newUrl} onChange={(e) => setNewUrl(e.target.value)} />
          <div className="hire-add-row">
            <button type="button" className="hire-cancel" onClick={() => { setAdding(false); setNewName(""); setNewUrl(""); }}>Cancel</button>
            <button type="submit" className="hire-save" disabled={!newName.trim() || !newUrl.trim()}>Add</button>
          </div>
        </form>
      ) : (
        <button className="hire-add-btn" onClick={() => setAdding(true)}>+ Add link</button>
      )}
    </div>
  );
}
