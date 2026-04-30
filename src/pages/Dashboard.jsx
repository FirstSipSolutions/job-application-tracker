import AppLayout from "../components/layout/AppLayout.jsx";
import RoleCard from "../components/role-and-job/RoleCard.jsx";

const MOCK_ROLES = [
  { id: "1", title: "Frontend Developer", jobs: [{}, {}, {}, {}], statusCounts: { outgoing: 4, draft: 1, pending: 2 } },
  { id: "2", title: "Fullstack Engineer", jobs: [{}, {}, {}, {}, {}, {}], statusCounts: { outgoing: 3, interview: 2, offer: 1 } },
  { id: "3", title: "Product Designer", jobs: [{}, {}], statusCounts: { draft: 1, rejected: 1 } },
];

export default function Dashboard() {
  return (
    <AppLayout breadcrumb={<span>Active Roles</span>}>
      <div style={{ padding: 32 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {MOCK_ROLES.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
