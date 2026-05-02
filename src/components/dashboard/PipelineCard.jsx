import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../context/ThemeContext.jsx";

function buildChartData(apps) {
  const today = new Date();
  return Array.from({ length: 8 }, (_, i) => {
    const end = new Date(today);
    end.setDate(today.getDate() - (7 * (7 - i)));
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const inBucket = apps.filter(a => {
      const d = new Date(a.date + "T00:00:00");
      return d >= start && d <= end;
    });
    return {
      day: end.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      applied:    inBucket.length,
      interviews: inBucket.filter(a => a.status === "Interview" || a.status === "Offer").length,
    };
  });
}

export default function PipelineCard({ apps = [] }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const data = buildChartData(apps);

  // raw hex required: CSS vars don't work in recharts props
  const c = {
    applied:    "#abc4ff",
    interviews: dark ? "#4cad7c" : "#2e8a58",
    grid:       dark ? "rgba(255,255,255,0.05)" : "rgba(171,196,255,0.15)",
    axis:       dark ? "#4a4a6a" : "#abc4ff",
    tooltip:    dark ? "#1a1a2e" : "#ffffff",
  };

  return (
    <div className="db-card db-pipeline">
      <div className="db-card-title">Application Overview</div>
      <div className="db-card-sub">last 8 weeks</div>

      <div className="db-chart-legend">
        <div className="db-legend-dot"><div className="db-dot" style={{ background: c.applied }} />Applied</div>
        <div className="db-legend-dot"><div className="db-dot" style={{ background: c.interviews }} />Interviews</div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="g-applied" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={c.applied}    stopOpacity={0.25} />
              <stop offset="95%" stopColor={c.applied}    stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g-interviews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={c.interviews} stopOpacity={0.25} />
              <stop offset="95%" stopColor={c.interviews} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: c.axis }} tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: c.axis }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: c.tooltip, border: "1px solid var(--db-border)", borderRadius: 4, fontSize: 12 }}
            labelStyle={{ color: "var(--db-text)", fontWeight: 600 }}
          />
          <Area type="monotone" dataKey="applied"    stroke={c.applied}    strokeWidth={2} fill="url(#g-applied)"    dot={false} />
          <Area type="monotone" dataKey="interviews" stroke={c.interviews} strokeWidth={2} fill="url(#g-interviews)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
