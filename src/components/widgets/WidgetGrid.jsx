import { useState } from "react";
import {
  DndContext, closestCenter, DragOverlay,
  PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, arrayMove,
  rectSortingStrategy, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Plus } from "lucide-react";

const DEFS = {
  "total-apps":    { label: "Total Applications", color: "var(--db-blue)",  val: a => a.length },
  "interviews":    { label: "Active Interviews",  color: "var(--db-green)", val: a => a.filter(x => x.status === "Interview").length },
  "rejections":    { label: "Rejections",         color: "var(--db-alert)", val: a => a.filter(x => x.status === "Rejected").length },
  "offers":        { label: "Offers",             color: "#f59e0b",         val: a => a.filter(x => x.status === "Offer").length },
  "response-rate": { label: "Response Rate",      color: "var(--db-blue)",  val: a => { const t = a.length; return t ? Math.round(a.filter(x => x.status !== "Applied").length / t * 100) + "%" : "—"; } },
  "this-week":     { label: "Applied This Week",  color: "var(--db-green)", val: a => { const cut = Date.now() - 7 * 864e5; return a.filter(x => new Date(x.date + "T00:00:00") >= cut).length; } },
};

const DEFAULT = ["total-apps", "interviews", "rejections", "response-rate"];

function load() {
  try { return (JSON.parse(localStorage.getItem("wg-order")) || DEFAULT).filter(id => id in DEFS); }
  catch { return DEFAULT; }
}
function save(order) { localStorage.setItem("wg-order", JSON.stringify(order)); }

function Card({ id, apps, editing, vertical, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const def = DEFS[id];
  const cls = vertical
    ? `wg-card-v${editing ? " wg-editing-v" : ""}`
    : `wg-card${editing ? " wg-editing" : ""}`;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0 : 1 }}
      className={cls}
      {...(editing ? { ...attributes, ...listeners } : {})} // drag handles only active in edit mode
    >
      {editing && <span className="wg-grip"><GripVertical size={13} /></span>}
      <span className={vertical ? "wg-val-v" : "wg-val"} style={{ color: def.color }}>{def.val(apps)}</span>
      <span className={vertical ? "wg-label-v" : "wg-label"}>{def.label}</span>
      {editing && (
        <button className="wg-remove" onClick={e => { e.stopPropagation(); onRemove(id); }}>
          <X size={11} />
        </button>
      )}
    </div>
  );
}

// floating clone rendered during drag — keeps original slot visible
function Ghost({ id, apps, vertical }) {
  const def = DEFS[id];
  return (
    <div className={vertical ? "wg-card-v wg-overlay" : "wg-card wg-overlay"}>
      <span className={vertical ? "wg-val-v" : "wg-val"} style={{ color: def.color }}>{def.val(apps)}</span>
      <span className={vertical ? "wg-label-v" : "wg-label"}>{def.label}</span>
    </div>
  );
}

export default function WidgetGrid({ apps, vertical = false }) {
  const [order, setOrder]     = useState(load);
  const [editing, setEditing] = useState(false);
  const [activeId, setActive] = useState(null);

  // distance:6 prevents a plain click from starting a drag
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onDragStart({ active }) { setActive(active.id); }
  function onDragEnd({ active, over }) {
    setActive(null);
    if (!over || active.id === over.id) return;
    setOrder(prev => { const next = arrayMove(prev, prev.indexOf(active.id), prev.indexOf(over.id)); save(next); return next; });
  }
  function removeWidget(id) { setOrder(prev => { const next = prev.filter(x => x !== id); save(next); return next; }); }
  function addWidget(id)    { setOrder(prev => { const next = [...prev, id]; save(next); return next; }); }

  const available = Object.keys(DEFS).filter(id => !order.includes(id));

  return (
    <div className={vertical ? "wg-wrap-v" : "wg-wrap"}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={order} strategy={vertical ? verticalListSortingStrategy : rectSortingStrategy}>
          <div className={vertical ? "wg-bar-v" : "wg-bar"}>
            {order.map(id => <Card key={id} id={id} apps={apps} editing={editing} vertical={vertical} onRemove={removeWidget} />)}
            {editing && available.map(id => (
              <button key={id} className="wg-add-chip" onClick={() => addWidget(id)}>
                <Plus size={11} /> {DEFS[id].label}
              </button>
            ))}
          </div>
        </SortableContext>
        <DragOverlay>{activeId ? <Ghost id={activeId} apps={apps} vertical={vertical} /> : null}</DragOverlay>
      </DndContext>

      <button
        className={`${vertical ? "wg-edit-inline" : "wg-edit-btn"}${editing ? " wg-edit-active" : ""}`}
        onClick={() => setEditing(e => !e)}
      >
        {editing ? "Done" : "Customize"}
      </button>
    </div>
  );
}
