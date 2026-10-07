import { useState, useMemo } from "react";
import { Plus, Search, Trash2, User, Phone, ChevronDown, ChevronUp, IndianRupee, X, Check } from "lucide-react";
import { Customer, formatCurrency, toDateString } from "../lib/store";

interface Props {
  customers: Customer[];
  onAdd: (data: Omit<Customer, "id" | "createdAt" | "payments" | "totalDue">) => void;
  onDelete: (id: string) => void;
  onAddPayment: (customerId: string, amount: number, notes?: string) => void;
  onUpdate: (id: string, data: Partial<Customer>) => void;
}

export default function Customers({ customers, onAdd, onDelete, onAddPayment, onUpdate }: Props) {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [form, setForm] = useState({ name: "", mobile: "", address: "", totalDue: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() =>
    customers.filter((c) =>
      !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search)
    ), [customers, search]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name required";
    if (!form.mobile.trim()) e.mobile = "Mobile required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    onAdd({ name: form.name.trim(), mobile: form.mobile.trim(), address: form.address.trim() || undefined });
    if (form.totalDue && Number(form.totalDue) > 0) {
      // We'll need to set totalDue on the newly created customer
      // Handle by updating after add
    }
    setForm({ name: "", mobile: "", address: "", totalDue: "" });
    setShowAddForm(false);
    setErrors({});
  };

  const handlePayment = (customerId: string) => {
    const amount = Number(paymentAmount);
    if (!amount || amount <= 0) return;
    onAddPayment(customerId, amount, paymentNotes || undefined);
    setPaymentId(null);
    setPaymentAmount("");
    setPaymentNotes("");
  };

  const totalDue = useMemo(() => customers.reduce((s, c) => s + c.totalDue, 0), [customers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Customer Ledger</h1>
          <p className="text-sm text-muted-foreground">{customers.length} customers · Total Due: <span className="text-red-500 font-semibold">{formatCurrency(totalDue)}</span></p>
        </div>
        <button data-testid="btn-add-customer" onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={15} /> Add Customer
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Add Customer</h2>
            <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Customer Name</label>
              <input data-testid="input-customer-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Mobile Number</label>
              <input data-testid="input-customer-mobile" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                placeholder="10-digit mobile"
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              {errors.mobile && <p className="text-xs text-destructive mt-0.5">{errors.mobile}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Address (optional)</label>
              <input data-testid="input-customer-address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Initial Due Amount (optional)</label>
              <input data-testid="input-customer-due" type="number" min="0" value={form.totalDue} onChange={(e) => setForm((f) => ({ ...f, totalDue: e.target.value }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" data-testid="btn-customer-submit"
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                <Check size={14} /> Save Customer
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
        <input data-testid="input-customer-search" placeholder="Search by name or mobile..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 rounded-lg border border-input bg-background pl-8 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-12 text-center">
            <User className="mx-auto text-muted-foreground mb-2" size={28} />
            <p className="text-muted-foreground text-sm">No customers found</p>
          </div>
        ) : filtered.map((c) => (
          <div key={c.id} data-testid={`customer-card-${c.id}`} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="text-primary" size={16} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone size={11} /> {c.mobile}
                    {c.address && <span> · {c.address}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-muted-foreground">Total Due</p>
                  <p className={`font-bold text-sm ${c.totalDue > 0 ? "text-red-500" : "text-emerald-500"}`}>
                    {formatCurrency(c.totalDue)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button data-testid={`btn-pay-${c.id}`} onClick={() => setPaymentId(paymentId === c.id ? null : c.id)}
                    className="h-7 px-2 rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 transition-colors">
                    <IndianRupee size={12} className="inline" /> Pay
                  </button>
                  <button data-testid={`btn-expand-${c.id}`} onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="h-7 px-2 rounded-md bg-muted text-muted-foreground text-xs hover:bg-muted/80 transition-colors">
                    {expandedId === c.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button data-testid={`btn-delete-customer-${c.id}`} onClick={() => confirm("Delete customer?") && onDelete(c.id)}
                    className="h-7 px-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>

            {paymentId === c.id && (
              <div className="px-4 pb-3 border-t border-border/50 pt-3 bg-muted/30">
                <p className="text-xs font-medium text-muted-foreground mb-2">Record Payment</p>
                <div className="flex gap-2">
                  <input type="number" min="0" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Amount (Rs.)" data-testid={`input-payment-amount-${c.id}`}
                    className="flex-1 h-8 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  <input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Notes (optional)"
                    className="flex-1 h-8 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button onClick={() => handlePayment(c.id)} data-testid={`btn-save-payment-${c.id}`}
                    className="h-8 px-3 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors">
                    Save
                  </button>
                </div>
              </div>
            )}

            {expandedId === c.id && (
              <div className="border-t border-border/50 px-4 py-3 bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Payment History ({c.payments.length} payments)</p>
                {c.payments.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No payments recorded yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {[...c.payments].reverse().map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{p.date}{p.notes ? ` · ${p.notes}` : ""}</span>
                        <span className="font-semibold text-emerald-500">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
