import { Building2, Clock, FileText, Layers, Send } from "lucide-react";
import Carousel from "../ui/Carousel.jsx";
import { getTechTags, getExperienceLevel } from "../../lib/jobs/filter.js";

// Deterministic hue from company name so each company has a consistent accent color
function companyColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360}, 70%, 62%)`;
}

function daysAgoLabel(postedAt) {
  if (!postedAt) return { text: null, stale: false };
  const d = Math.floor((Date.now() - new Date(postedAt)) / 864e5);
  if (d === 0) return { text: "Today",     stale: false };
  if (d === 1) return { text: "Yesterday", stale: false };
  return { text: `${d}d ago`, stale: d >= 10 };
}

function expLabel(job) {
  const e = job.groqExp ?? getExperienceLevel(job);
  if (e === "0-2") return "0-2 yrs";
  if (e === "2-5") return "2-5 yrs";
  if (e === "5+")  return "5+ yrs";
  return null;
}

export default function JobCard({ job, onApply }) {
  const tags  = getTechTags(job);
  const { text: ageText, stale } = daysAgoLabel(job.postedAt);
  const exp   = expLabel(job);
  const color = companyColor(job.company);

  const slides = [
    {
      id: 1,
      icon: <Building2 color={color} />,
      label: job.source,
      title: job.title,
      body: job.company,
      action: () => onApply(job),
      actionLabel: "View & Log Application",
      iconColor: color,
    },
    {
      id: 2,
      icon: <Clock color={color} />,
      label: ageText ?? undefined,
      labelStyle: stale ? { color: "#f59e0b" } : undefined,
      iconColor: color,
      title: exp ? `${exp} experience` : "Details",
      body: [
        job.salary,
        job.canadaOpen === true ? "Canada open" : null,
        job.location && job.location !== "Remote" ? job.location : null,
      ].filter(Boolean).join("  |  ") || "Remote position",
    },
    {
      id: 3,
      icon: <FileText color={color} />,
      label: "About",
      title: "Role",
      body: job.descriptionSnippet?.slice(0, 280) ?? "No description available.",
      iconColor: color,
    },
    tags.length > 0 && {
      id: 4,
      icon: <Layers color={color} />,
      label: "Stack",
      title: "Tech",
      tags,
      iconColor: color,
    },
    {
      id: 5,
      icon: <Send color={color} />,
      label: "Remote",
      title: "Apply",
      body: job.company,
      action: () => onApply(job),
      actionLabel: "View & Log Application",
      iconColor: color,
    },
  ].filter(Boolean);

  return <Carousel items={slides} />;
}
