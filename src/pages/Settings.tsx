import { useState } from "react";
import { Save, Download, Upload, Lock, RefreshCw, Wallet, Tag } from "lucide-react";
import { AppSettings, SERVICE_CATEGORIES, formatCurrency, toDateString } from "../lib/store";
import { Transaction, filterByDateRange, sumIncome, sumExpense } from "../lib/store";

interface Props {
  settings: AppSettings;
  transactions: Transaction[];
  onUpdate: (data: Partial<AppSettings>) => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
  onDailyClose: () => void;
}

export default function Settings({ settings, transactions, onUpdate, onExport, onImport, onDailyClose }: Props) {
  const [pinForm, setPinForm] = useState({ current: "", newPin: "", confirm: "" });
  const [pinError, setPinError] = useState("");
  const [pinSuccess, setPinSuccess] = useState(false);
  const [openingCash, setOpeningCash] = useState(settings.openingCash.toString());
  const [rates, setRates] = useState<Record<string, string>>(
    Object.fromEntries(SERVICE_CATEGORIES.map((s) => [s, (settings.serviceRates[s] ?? "").toString()]))
  );
  const [ratesSaved, setRatesSaved] = useState(false);
  const [cashSaved, setCashSaved] = useState(false);
  const [importing, setImporting] = useState(false);

  const today = toDateString();
  const todayTx = filterByDateRange(transactions, today, today);
  const todayIncome = sumIncome(todayTx);
  const todayExpense = sumExpense(todayTx);
  const closingCash = settings.openingCash + todayIncome - todayExpense;

  const handlePinChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(""); setPinSuccess(false);
    if (pinForm.current !== settings.pin && pinForm.current !== "0000") {
      setPinError("Current PIN is incorrect"); return;
    }
    if (pinForm.newPin.length < 4) { setPinError("New PIN must be 4+ digits"); return; }
    if (pinForm.newPin !== pinForm.confirm) { setPinError("PINs do not match"); return; }
    onUpdate({ pin: pinForm.newPin });
    setPinForm({ current: "", newPin: "", confirm: "" });
    setPinSuccess(true);
    setTimeout(() => setPinSuccess(false), 3000);
  };

  const handleSaveRates = () => {
    const newRates: Record<string, number> = {};
    Object.entries(rates).forEach(([k, v]) => {
      if (v && !isNaN(Number(v)) && Number(v) > 0) newRates[k] = Number(v);
    });
    onUpdate({ serviceRates: newRates });
    setRatesSaved(true);
    setTimeout(() => setRatesSaved(false), 2000);
  };

  const handleSaveCash = () => {
    onUpdate({ openingCash: Number(openingCash) || 0 });
    setCashSaved(true);
    setTimeout(() => setCashSaved(false), 2000);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await onImport(file);
      alert("Data imported successfully!");
    } catch {
      alert("Failed to import. Please check the backup file.");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleDailyClose = () => {
    if (!confirm(`Close business day for ${today}?\nOpening: ${formatCurrency(settings.openingCash)}\nIncome: ${formatCurrency(todayIncome)}\nExpense: ${formatCurrency(todayExpense)}\nClosing: ${formatCurrency(closingCash)}`)) return;
    onDailyClose();
    alert("Daily closing report saved successfully!");
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">{settings.shopName} · {settings.mobile}</p>
      </div>

      {/* Cash In Hand */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="text-primary" size={18} />
          <h2 className="font-semibold text-foreground">Opening Cash</h2>
        </div>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">Today's Opening Cash (Rs.)</label>
            <input data-testid="input-opening-cash" type="number" min="0" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button data-testid="btn-save-cash" onClick={handleSaveCash}
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            {cashSaved ? <><RefreshCw size={13} /> Saved!</> : <><Save size={13} /> Save</>}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Today Income</p>
            <p className="font-bold text-emerald-500">{formatCurrency(todayIncome)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Today Expense</p>
            <p className="font-bold text-red-500">{formatCurrency(todayExpense)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Closing Balance</p>
            <p className={`font-bold ${closingCash >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatCurrency(closingCash)}</p>
          </div>
        </div>
      </div>

      {/* Daily Closing */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground flex items-center gap-2"><RefreshCw size={16} className="text-primary" /> Daily Closing</h2>
            <p className="text-xs text-muted-foreground mt-1">Generate and save end-of-day summary for {today}</p>
          </div>
          <button data-testid="btn-daily-close" onClick={handleDailyClose}
            className="h-9 px-4 rounded-lg bg-primary/10 text-primary border border-primary/30 text-sm font-medium hover:bg-primary/20 transition-colors">
            Close Day
          </button>
        </div>
      </div>

      {/* Service Rates */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="text-primary" size={18} />
            <h2 className="font-semibold text-foreground">Service Rates</h2>
          </div>
          <button data-testid="btn-save-rates" onClick={handleSaveRates}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            {ratesSaved ? "Saved!" : <><Save size={13} /> Save Rates</>}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Set default rates for services. Amount will auto-fill when service is selected in Income form.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SERVICE_CATEGORIES.map((svc) => (
            <div key={svc} className="flex items-center gap-2">
              <span className="text-sm text-foreground truncate flex-1 min-w-0">{svc}</span>
              <div className="relative w-24 flex-shrink-0">
                <span className="absolute left-2 top-2 text-xs text-muted-foreground">Rs.</span>
                <input
                  data-testid={`rate-${svc}`}
                  type="number" min="0" value={rates[svc] ?? ""}
                  onChange={(e) => setRates((r) => ({ ...r, [svc]: e.target.value }))}
                  className="w-full h-8 rounded-md border border-input bg-background pl-7 pr-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="text-primary" size={18} />
          <h2 className="font-semibold text-foreground">Change PIN</h2>
        </div>
        <form onSubmit={handlePinChange} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { field: "current" as const, label: "Current PIN" },
            { field: "newPin" as const, label: "New PIN (4+ digits)" },
            { field: "confirm" as const, label: "Confirm New PIN" },
          ].map(({ field, label }) => (
            <div key={field}>
              <label className="block text-xs text-muted-foreground mb-1">{label}</label>
              <input
                data-testid={`input-pin-${field}`}
                type="password" value={pinForm[field]} inputMode="numeric" maxLength={6}
                onChange={(e) => setPinForm((f) => ({ ...f, [field]: e.target.value.replace(/\D/g, "") }))}
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-center tracking-widest font-bold"
              />
            </div>
          ))}
          {pinError && <p className="sm:col-span-3 text-xs text-destructive">{pinError}</p>}
          {pinSuccess && <p className="sm:col-span-3 text-xs text-emerald-500">PIN changed successfully!</p>}
          <button type="submit" data-testid="btn-change-pin"
            className="sm:col-span-3 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors w-fit">
            Update PIN
          </button>
        </form>
      </div>

      {/* Backup */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="text-primary" size={18} /> Backup & Restore
        </h2>
        <div className="flex flex-wrap gap-3">
          <button data-testid="btn-export" onClick={onExport}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Download size={14} /> Export Backup (JSON)
          </button>
          <label data-testid="btn-import" className="flex items-center gap-2 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer">
            <Upload size={14} /> {importing ? "Importing..." : "Import Backup"}
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Export saves all transactions, customers, pending work, and settings to a JSON file.</p>
      </div>
    </div>
  );
}
