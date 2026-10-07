import { useState, useMemo } from "react";
import { Plus, CheckCircle2, Clock, Trash2, AlertCircle, X, Check } from "lucide-react";
import { PendingWork, toDateString } from "../lib/store";

interface Props {
  pendingWorks: PendingWork[];
  onAdd: (data: Omit<PendingWork, "id" | "createdAt" | "status">) => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<PendingWork>) => void;
}

const PRIORITIES = ["high", "medium", "low"] as const;
const EMPTY = { service: "", customerName: "", details: "", dueDate: toDateString(), priority: "medium" as const };

export default function PendingWorkPage({ pendingWorks, onAdd, onComplete, onDelete }: Props) {
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pending = useMemo(() => pendingWorks.filter((p) => p.status === "pending"), [pendingWorks]);
  const completed = useMemo(() => pendingWorks.filter((p) => p.status === "completed"), [pendingWorks]);
  const overdue = useMemo(() => pending.filter((p) => p.dueDate < toDateString()), [pending]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.service.trim()) e.service = "Service required";
    if (!form.customerName.trim()) e.customerName = "Customer name required";
    if (!form.dueDate) e.dueDate = "Due date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onAdd({ ...form, service: form.service.trim(), customerName: form.customerName.trim() });
    setForm(EMPTY); setShowForm(false); setErrors({});
  };

  const priorityColor: Record<string, string> = {
    high: "text-red-500 bg-red-500/10",
    medium: "text-yellow-500 bg-yellow-500/10",
    low: "text-emerald-500 bg-emerald-500/10",
  };

  const WorkCard = ({ pw }: { pw: PendingWork }) => {
    const isOverdue = pw.status === "pending" && pw.dueDate < toDateString();
    return (
      <div data-testid={`pending-card-${pw.id}`} className={`rounded-xl border bg-card p-4 ${isOverdue ? "border-red-500/30" : "border-border"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-foreground">{pw.service}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor[pw.priority]}`}>
                {pw.priority.charAt(0).toUpperCase() + pw.priority.slice(1)}
              </span>
              {isOverdue && (
                <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                  <AlertCircle size={11} /> Overdue
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{pw.customerName}</p>
            {pw.details && <p className="text-xs text-muted-foreground mt-1">{pw.details}</p>}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Clock size={11} />
              <span>Due: {pw.dueDate}</span>
              {pw.completedAt && <span> · Done: {pw.completedAt.split("T")[0]}</span>}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            {pw.status === "pending" && (
              <button data-testid={`btn-complete-${pw.id}`} onClick={() => onComplete(pw.id)}
                className="h-7 px-2 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 transition-colors flex items-center gap-1">
                <CheckCircle2 size={12} /> Done
              </button>
            )}
            <button data-testid={`btn-delete-pending-${pw.id}`} onClick={() => confirm("Delete this work?") && onDelete(pw.id)}
              className="h-7 px-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Pending Work</h1>
          <p className="text-sm text-muted-foreground">
            {pending.length} pending
            {overdue.length > 0 && <span className="text-red-500 ml-1">· {overdue.length} overdue</span>}
          </p>
        </div>
        <button data-testid="btn-add-pending" onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={15} /> Add Work
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Add Pending Work</h2>
            <button onClick={() => { setShowForm(false); setForm(EMPTY); }} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Service</label>
              <input data-testid="input-pending-service" value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
                placeholder="e.g. PAN Card, Aadhaar"
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.service && <p className="text-xs text-destructive mt-0.5">{errors.service}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Customer Name</label>
              <input data-testid="input-pending-customer" value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.customerName && <p className="text-xs text-destructive mt-0.5">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Due Date</label>
              <input type="date" data-testid="input-pending-due" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.dueDate && <p className="text-xs text-destructive mt-0.5">{errors.dueDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Priority</label>
              <select data-testid="select-pending-priority" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as typeof PRIORITIES[number] }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Details (optional)</label>
              <input data-testid="input-pending-details" value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" data-testid="btn-pending-submit"
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <Check size={14} /> Save
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(EMPTY); }}
                className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 w-fit">
        <button data-testid="tab-pending" onClick={() => setTab("pending")}
          className={`px-4 h-8 rounded-md text-sm font-medium transition-colors ${tab === "pending" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Pending ({pending.length})
        </button>
        <button data-testid="tab-completed" onClick={() => setTab("completed")}
          className={`px-4 h-8 rounded-md text-sm font-medium transition-colors ${tab === "completed" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Completed ({completed.length})
        </button>
      </div>

      <div className="space-y-3">
        {(tab === "pending" ? pending : completed).length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-12 text-center">
            <CheckCircle2 className="mx-auto text-muted-foreground mb-2" size={28} />
            <p className="text-muted-foreground text-sm">{tab === "pending" ? "No pending work" : "No completed work"}</p>
          </div>
        ) : (tab === "pending" ? pending : completed).map((pw) => (
          <WorkCard key={pw.id} pw={pw} />
        ))}
      </div>
    </div>
  );
}
