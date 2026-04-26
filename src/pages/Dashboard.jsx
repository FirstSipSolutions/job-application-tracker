// Dashboard — what users see after signing in. URL: /app
// Will show a grid of RoleCards (one per role they're hunting) plus a "+" button to create a new role.
import RoleCard from "../components/role-and-job/RoleCard.jsx";

// mock data added to dashboard every " {} " is a job - so the entry says 3 jobs
export default function Dashboard() {
  const mock = {
    id: "1",
    title: "Frontend Developer",
    jobs: [{}, {}, {}, {}],
    statusCounts: { outgoing: 4, draft: 1, pending: 2 },
  };
  return (
    <div style={{ padding: 40 }}>
      <RoleCard role={mock} />
    </div>
  );
}
