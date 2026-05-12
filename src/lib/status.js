// Single source of truth for application status colors and options.
// Imported by any component that renders a status badge or picker.

export const STATUS_OPTIONS = ["Applied", "Screening", "Interview", "Offer", "Rejected"];

export const STATUS_COLOR = {
  Applied:   "#5ba3ff",
  Screening: "#abc4ff",
  Interview: "#4cad7c",
  Offer:     "#f59e0b",
  Rejected:  "#e5989b",
};
