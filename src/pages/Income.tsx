import { useState, useMemo } from "react";
import { Plus, Search, Trash2, Edit3, Printer, X, Check } from "lucide-react";
import { Transaction, SERVICE_CATEGORIES, PAYMENT_MODES, formatCurrency, toDateString } from "../lib/store";

interface Props {
  transactions: Transaction[];
  serviceRates: Record<string, number>;
  onAdd: (data: Omit<Transaction, "id" | "createdAt" | "receiptNumber">) => Transaction;
  onUpdate: (id: string, data: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

const EMPTY = { amount: "", customerName: "", notes: "", date: toDateString(), category: "Photocopy", paymentMode: "Cash" as const };

export default function Income({ transactions, serviceRates, onAdd, onUpdate, onDelete }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMode, setFilterMode] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const incomeTx = useMemo(() => transactions.filter((t) => t.type === "income"), [transactions]);

  const filtered = useMemo(() => {
    return incomeTx.filter((t) => {
      if (search && !t.category.toLowerCase().includes(search.toLowerCase()) &&
        !(t.customerName?.toLowerCase().includes(search.toLowerCase())) &&
        !(t.notes?.toLowerCase().includes(search.toLowerCase()))) return false;
      if (filterDate && t.date !== filterDate) return false;
      if (filterMonth && !t.date.startsWith(filterMonth)) return false;
      if (filterYear && !t.date.startsWith(filterYear)) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (filterMode && t.paymentMode !== filterMode) return false;
      return true;
    });
  }, [incomeTx, search, filterDate, filterMonth, filterYear, filterCategory, filterMode]);

  const handleCategoryChange = (cat: string) => {
    const rate = serviceRates[cat];
    setForm((f) => ({ ...f, category: cat, amount: rate ? rate.toString() : f.amount }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = "Enter valid amount";
    if (!form.date) e.date = "Date required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const data = {
      type: "income" as const,
      amount: Number(form.amount),
      customerName: form.customerName || undefined,
      notes: form.notes || undefined,
      date: form.date,
      category: form.category,
      paymentMode: form.paymentMode as typeof PAYMENT_MODES[number],
    };
    if (editId) {
      onUpdate(editId, data);
      setEditId(null);
    } else {
      onAdd(data);
    }
    setForm(EMPTY);
    setShowForm(false);
    setErrors({});
  };

  const startEdit = (t: Transaction) => {
    setForm({
      amount: t.amount.toString(),
      customerName: t.customerName ?? "",
      notes: t.notes ?? "",
      date: t.date,
      category: t.category,
      paymentMode: t.paymentMode,
    });
    setEditId(t.id);
    setShowForm(true);
  };

  const handlePrint = (t: Transaction) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Receipt</title>
      <style>body{font-family:Arial,sans-serif;max-width:300px;margin:20px auto;font-size:13px}
      h2{text-align:center;margin:0}p{margin:4px 0}.line{border-top:1px dashed #000;margin:8px 0}
      .row{display:flex;justify-content:space-between}</style></head>
      <body>
        <h2>Rohit CSC Center</h2>
        <p style="text-align:center">Contact: 8340507757</p>
        <div class="line"></div>
        <p class="row"><span>Receipt No:</span><span>${t.receiptNumber}</span></p>
        <p class="row"><span>Date:</span><span>${t.date}</span></p>
        <div class="line"></div>
        <p class="row"><span>Service:</span><span>${t.category}</span></p>
        ${t.customerName ? `<p class="row"><span>Customer:</span><span>${t.customerName}</span></p>` : ""}
        <p class="row"><span>Payment:</span><span>${t.paymentMode}</span></p>
        ${t.notes ? `<p>Notes: ${t.notes}</p>` : ""}
        <div class="line"></div>
        <p class="row"><b>Amount:</b><b>Rs. ${t.amount}</b></p>
        <div class="line"></div>
        <p style="text-align:center;font-size:11px">Thank you for visiting!<br>Developed By Mr Rohit</p>
      </body></html>
    `);
    win.print();
  };

  const Input = ({ field, label, type = "text", ...rest }: { field: keyof typeof form; label: string; type?: string; [k: string]: unknown }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      <input
        data-testid={`input-income-${field}`}
        type={type}
        value={form[field]}
        onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
        className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        {...rest}
      />
      {errors[field] && <p className="text-xs text-destructive mt-0.5">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Income</h1>
          <p className="text-sm text-muted-foreground">{incomeTx.length} total entries</p>
        </div>
        <button
          data-testid="btn-add-income"
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={15} /> Add Income
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">{editId ? "Edit Income" : "Add Income Entry"}</h2>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Service Category</label>
              <select
                data-testid="select-income-category"
                value={form.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Input field="amount" label={`Amount (Rs.)${serviceRates[form.category] ? ` — Rate: ${serviceRates[form.category]}` : ""}`} type="number" min="0" step="0.01" />
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Mode</label>
              <select
                data-testid="select-income-mode"
                value={form.paymentMode}
                onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value as typeof PAYMENT_MODES[number] }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <Input field="customerName" label="Customer Name (optional)" />
            <Input field="date" label="Date" type="date" />
            <Input field="notes" label="Notes (optional)" />
            <div className="sm:col-span-2 lg:col-span-3 flex gap-2 pt-1">
              <button type="submit" data-testid="btn-income-submit" className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <Check size={14} /> {editId ? "Update" : "Save Entry"}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }} className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="relative col-span-2 sm:col-span-1">
            <Search size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <input
              data-testid="input-income-search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} data-testid="filter-income-date"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} data-testid="filter-income-month"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} data-testid="filter-income-year"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Years</option>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y}>{y}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} data-testid="filter-income-cat"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Services</option>
            {SERVICE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} data-testid="filter-income-mode"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">All Modes</option>
            {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        {(search || filterDate || filterMonth || filterYear || filterCategory || filterMode) && (
          <button onClick={() => { setSearch(""); setFilterDate(""); setFilterMonth(""); setFilterYear(""); setFilterCategory(""); setFilterMode(""); }}
            className="mt-2 text-xs text-primary hover:underline">Clear all filters</button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">{filtered.length} entries</span>
          <span className="text-sm font-bold text-emerald-500">Total: {formatCurrency(filtered.reduce((s, t) => s + t.amount, 0))}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Date</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Service</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground hidden sm:table-cell">Customer</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">Mode</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">Receipt</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">No entries found</td></tr>
              ) : filtered.map((t) => (
                <tr key={t.id} data-testid={`income-row-${t.id}`} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5 text-foreground">{t.date}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{t.category}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{t.customerName ?? "-"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{t.paymentMode}</td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs hidden lg:table-cell">{t.receiptNumber}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-emerald-500">{formatCurrency(t.amount)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button data-testid={`btn-edit-income-${t.id}`} onClick={() => startEdit(t)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Edit3 size={13} /></button>
                      <button data-testid={`btn-print-receipt-${t.id}`} onClick={() => handlePrint(t)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Printer size={13} /></button>
                      <button data-testid={`btn-delete-income-${t.id}`} onClick={() => confirm("Delete this entry?") && onDelete(t.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={13} /></button>
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
