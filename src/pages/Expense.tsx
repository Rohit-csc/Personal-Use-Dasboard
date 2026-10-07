import { useState, useMemo } from "react";
import { Plus, Search, Trash2, Edit3, X, Check } from "lucide-react";
import { Transaction, EXPENSE_CATEGORIES, PAYMENT_MODES, formatCurrency, toDateString } from "../lib/store";

interface Props {
  transactions: Transaction[];
  onAdd: (data: Omit<Transaction, "id" | "createdAt" | "receiptNumber">) => Transaction;
  onUpdate: (id: string, data: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

const EMPTY = { amount: "", notes: "", date: toDateString(), category: "Rent", paymentMode: "Cash" as const };

export default function Expense({ transactions, onAdd, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const expenseTx = useMemo(() => transactions.filter((t) => t.type === "expense"), [transactions]);

  const filtered = useMemo(() => {
    return expenseTx.filter((t) => {
      if (search && !t.category.toLowerCase().includes(search.toLowerCase()) && !(t.notes?.toLowerCase().includes(search.toLowerCase()))) return false;
      if (filterDate && t.date !== filterDate) return false;
      if (filterMonth && !t.date.startsWith(filterMonth)) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      return true;
    });
  }, [expenseTx, search, filterDate, filterMonth, filterCategory]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = "Enter valid amount";
    if (!form.date) e.date = "Date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const data = {
      type: "expense" as const,
      amount: Number(form.amount),
      notes: form.notes || undefined,
      date: form.date,
      category: form.category,
      paymentMode: form.paymentMode as typeof PAYMENT_MODES[number],
    };
    if (editId) { onUpdate(editId, data); setEditId(null); }
    else onAdd(data);
    setForm(EMPTY); setShowForm(false); setErrors({});
  };

  const startEdit = (t: Transaction) => {
    setForm({ amount: t.amount.toString(), notes: t.notes ?? "", date: t.date, category: t.category, paymentMode: t.paymentMode });
    setEditId(t.id); setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Expense</h1>
          <p className="text-sm text-muted-foreground">{expenseTx.length} total entries</p>
        </div>
        <button data-testid="btn-add-expense" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">{editId ? "Edit Expense" : "Add Expense"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select data-testid="select-expense-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Amount (Rs.)</label>
              <input data-testid="input-expense-amount" type="number" min="0" step="0.01" value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.amount && <p className="text-xs text-destructive mt-0.5">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Mode</label>
              <select data-testid="select-expense-mode" value={form.paymentMode} onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value as typeof PAYMENT_MODES[number] }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
              <input data-testid="input-expense-date" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.date && <p className="text-xs text-destructive mt-0.5">{errors.date}</p>}
            </div>
            <div className="sm:col-span-1 lg:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Notes (optional)</label>
              <input data-testid="input-expense-notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-1">
              <button type="submit" data-testid="btn-expense-submit"
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">
                <Check size={14} /> {editId ? "Update" : "Save"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }}
                className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <input data-testid="input-expense-search" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} data-testid="filter-expense-date"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} data-testid="filter-expense-month"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} data-testid="filter-expense-cat"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">{filtered.length} entries</span>
          <span className="text-sm font-bold text-red-500">Total: {formatCurrency(filtered.reduce((s, t) => s + t.amount, 0))}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Category</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">Mode</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Notes</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground text-sm">No entries found</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} data-testid={`expense-row-${t.id}`} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-foreground">{t.date}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{t.category}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{t.paymentMode}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{t.notes ?? "-"}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-red-500">{formatCurrency(t.amount)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button data-testid={`btn-edit-expense-${t.id}`} onClick={() => startEdit(t)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit3 size={13} /></button>
                      <button data-testid={`btn-delete-expense-${t.id}`} onClick={() => confirm("Delete this entry?") && onDelete(t.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
