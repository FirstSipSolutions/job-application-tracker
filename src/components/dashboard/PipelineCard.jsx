import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../context/ThemeContext.jsx";

const DATA = [
  { day: "Apr 2",  applied: 2, interviews: 0, followups: 0 },
  { day: "Apr 5",  applied: 4, interviews: 1, followups: 1 },
  { day: "Apr 8",  applied: 3, interviews: 0, followups: 2 },
  { day: "Apr 11", applied: 5, interviews: 2, followups: 1 },
  { day: "Apr 14", applied: 2, interviews: 1, followups: 3 },
  { day: "Apr 17", applied: 6, interviews: 2, followups: 2 },
  { day: "Apr 20", applied: 4, interviews: 3, followups: 4 },
  { day: "Apr 23", applied: 7, interviews: 2, followups: 3 },
  { day: "Apr 26", applied: 5, interviews: 4, followups: 5 },
  { day: "Apr 29", applied: 8, interviews: 3, followups: 4 },
  { day: "May 1",  applied: 6, interviews: 5, followups: 6 },
];

export default function PipelineCard() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  // raw hex required: CSS vars don't work in recharts props
  const c = {
    applied:    "#abc4ff",
    interviews: dark ? "#4cad7c" : "#2e8a58",
    followups:  "#fbbf24",
    grid:       dark ? "rgba(255,255,255,0.05)" : "rgba(171,196,255,0.15)",
    axis:       dark ? "#4a4a6a" : "#abc4ff",
    tooltip:    dark ? "#1a1a2e" : "#ffffff",
  };

  return (
    <div className="db-card db-pipeline">
      <div className="db-card-title">Application Overview</div>
      <div className="db-card-sub">the last 30 days</div>

      <div className="db-chart-legend">
        <div className="db-legend-dot"><div className="db-dot" style={{ background: c.applied }} />Applied</div>
        <div className="db-legend-dot"><div className="db-dot" style={{ background: c.interviews }} />Interviews</div>
        <div className="db-legend-dot"><div className="db-dot" style={{ background: c.followups }} />Follow-ups</div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={DATA} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="g-applied"    x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={c.applied}    stopOpacity={0.25} />
              <stop offset="95%" stopColor={c.applied}    stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g-interviews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={c.interviews} stopOpacity={0.25} />
              <stop offset="95%" stopColor={c.interviews} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g-followups"  x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={c.followups}  stopOpacity={0.25} />
              <stop offset="95%" stopColor={c.followups}  stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: c.axis }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: c.axis }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: c.tooltip, border: "1px solid var(--db-border)", borderRadius: 4, fontSize: 12 }}
            labelStyle={{ color: "var(--db-text)", fontWeight: 600 }}
          />
          <Area type="monotone" dataKey="applied"    stroke={c.applied}    strokeWidth={2} fill="url(#g-applied)"    dot={false} />
          <Area type="monotone" dataKey="interviews" stroke={c.interviews} strokeWidth={2} fill="url(#g-interviews)" dot={false} />
          <Area type="monotone" dataKey="followups"  stroke={c.followups}  strokeWidth={2} fill="url(#g-followups)"  dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
