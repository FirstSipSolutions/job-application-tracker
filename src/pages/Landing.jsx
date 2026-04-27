import { Link } from "react-router-dom";
import Aurora from "../components/effects/Aurora.jsx";

const PALETTE = {
  text: "#e8e2d9",
  textDim: "rgba(232, 226, 217, 0.65)",
  accent: "#c9a96e",
  panel: "rgba(20, 16, 12, 0.55)",
  panelBorder: "rgba(255, 235, 200, 0.08)",
};

export default function Landing() {
  return (
    <>
      <Aurora
        colorStops={["#080808", "#242424", "#131314"]}
        blend={0.9}
        amplitude={3.2}
        speed={0.3}
      />

      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "64px 24px",
          color: PALETTE.text,
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            background: PALETTE.panel,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${PALETTE.panelBorder}`,
            borderRadius: 16,
            padding: "48px 40px",
          }}
        >
          {/* ── Hero ── */}
          <h1
            style={{
              fontSize: 36,
              fontWeight: 300,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            App
            <span style={{ color: PALETTE.accent, fontWeight: 500 }}>
              Track
            </span>
          </h1>
          <p style={{ color: PALETTE.textDim, marginTop: 12, fontSize: 16 }}>
            Your job hunt, organized.
          </p>

          <Section title="What it does">
            <p>
              Run your job search like a project. Spin up a role card for every
              kind of position you're chasing, log each application under it,
              and move them through your pipeline from saved to offer.
            </p>
          </Section>

          <Section title="Features">
            <ul style={listStyle}>
              <li>
                One role card per target — Frontend, Full Stack, Backend,
                anything
              </li>
              <li>Run as many role cards in parallel as you need</li>
              <li>Kanban pipeline: Saved → Applied → Interview → Offer</li>
              <li>Notes, contacts, and dates on every application</li>
            </ul>
          </Section>

          <Section title="How it works">
            <ol style={listStyle}>
              <li>Sign up and land on your dashboard</li>
              <li>Hit + to create a role card for a role you're chasing</li>
              <li>Open the role and add jobs as you apply</li>
              <li>
                Drag job cards through Saved → Applied → Interview → Offer
              </li>
            </ol>
          </Section>

          <Section title="Get started">
            <p style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <CTA to="/app">Try the demo</CTA>
              <CTA to="/signup">Sign up</CTA>
              <CTA to="/login" subtle>
                Sign in
              </CTA>
            </p>
          </Section>

          <Section title="Built with">
            <ul style={listStyle}>
              <li>React + Vite</li>
              <li>Supabase (auth + database)</li>
              <li>[Styling — TBD]</li>
            </ul>
          </Section>

          <hr
            style={{
              border: 0,
              borderTop: `1px solid ${PALETTE.panelBorder}`,
              margin: "32px 0 16px",
            }}
          />
          <p style={{ color: PALETTE.textDim, fontSize: 12, margin: 0 }}>
            First Sip Solutions · 2026
          </p>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 32 }}>
      <h2
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: PALETTE.accent,
          marginBottom: 12,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function CTA({ to, children, subtle }) {
  return (
    <Link
      to={to}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "10px 20px",
        borderRadius: 10,
        border: `1px solid ${subtle ? "rgba(201,169,110,0.2)" : PALETTE.accent}`,
        color: subtle ? PALETTE.textDim : PALETTE.accent,
        background: subtle ? "transparent" : "rgba(180, 130, 70, 0.08)",
        textDecoration: "none",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Link>
  );
}

const listStyle = {
  paddingLeft: 20,
  margin: 0,
  color: PALETTE.text,
};
