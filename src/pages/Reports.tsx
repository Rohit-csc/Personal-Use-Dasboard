import { useState, useMemo } from "react";
import { Printer, FileText, Calendar } from "lucide-react";
import { Transaction, filterByDateRange, sumIncome, sumExpense, formatCurrency, getDateRange, SERVICE_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_MODES } from "../lib/store";

interface Props {
  transactions: Transaction[];
  shopName: string;
  mobile: string;
}

type ReportType = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export default function Reports({ transactions, shopName, mobile }: Props) {
  const [reportType, setReportType] = useState<ReportType>("daily");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const dateRange = useMemo(() => {
    if (reportType === "custom") return { start: customStart, end: customEnd };
    const map: Record<string, "today" | "week" | "month" | "year"> = {
      daily: "today", weekly: "week", monthly: "month", yearly: "year",
    };
    return getDateRange(map[reportType] as "today" | "week" | "month" | "year");
  }, [reportType, customStart, customEnd]);

  const filtered = useMemo(() =>
    dateRange.start && dateRange.end ? filterByDateRange(transactions, dateRange.start, dateRange.end) : [],
    [transactions, dateRange]
  );

  const income = sumIncome(filtered);
  const expense = sumExpense(filtered);
  const profit = income - expense;

  const incomeByService = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter((t) => t.type === "income").forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const byMode = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter((t) => t.type === "income").forEach((t) => {
      map[t.paymentMode] = (map[t.paymentMode] ?? 0) + t.amount;
    });
    return map;
  }, [filtered]);

  const handlePrint = () => {
    window.print();
  };

  const reportTypeLabel = {
    daily: "Daily Report",
    weekly: "Weekly Report",
    monthly: "Monthly Report",
    yearly: "Yearly Report",
    custom: "Custom Report",
  }[reportType];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and print business reports</p>
        </div>
        <button data-testid="btn-print-report" onClick={handlePrint}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Printer size={15} /> Print Report
        </button>
      </div>

      {/* Report Type Selector */}
      <div className="rounded-xl border border-border bg-card p-4 no-print">
        <p className="text-sm font-semibold text-foreground mb-3">Select Report Type</p>
        <div className="flex flex-wrap gap-2">
          {(["daily", "weekly", "monthly", "yearly", "custom"] as ReportType[]).map((type) => (
            <button key={type} data-testid={`btn-report-${type}`} onClick={() => setReportType(type)}
              className={`h-8 px-4 rounded-lg text-sm font-medium transition-colors ${reportType === type ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
        {reportType === "custom" && (
          <div className="flex gap-3 mt-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">From</label>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} data-testid="input-report-start"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">To</label>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} data-testid="input-report-end"
                className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        )}
      </div>

      {/* Report Preview */}
      <div className="rounded-xl border border-border bg-card overflow-hidden" id="report-content">
        {/* Print Header */}
        <div className="bg-primary/10 border-b border-border px-6 py-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <FileText className="text-primary" size={20} />
            <h2 className="text-lg font-bold text-foreground">{shopName}</h2>
          </div>
          <p className="text-sm text-muted-foreground">Contact: {mobile}</p>
          <p className="text-base font-semibold text-foreground mt-2">{reportTypeLabel}</p>
          <p className="text-sm text-muted-foreground">
            {dateRange.start && dateRange.end
              ? dateRange.start === dateRange.end
                ? dateRange.start
                : `${dateRange.start} to ${dateRange.end}`
              : "Select date range"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Generated: {new Date().toLocaleString("en-IN")}</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 border-b border-border">
          <div className="px-6 py-4 text-center border-r border-border">
            <p className="text-xs text-muted-foreground mb-1">Total Income</p>
            <p className="text-xl font-bold text-emerald-500">{formatCurrency(income)}</p>
          </div>
          <div className="px-6 py-4 text-center border-r border-border">
            <p className="text-xs text-muted-foreground mb-1">Total Expense</p>
            <p className="text-xl font-bold text-red-500">{formatCurrency(expense)}</p>
          </div>
          <div className="px-6 py-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
            <p className={`text-xl font-bold ${profit >= 0 ? "text-emerald-500" : "text-red-500"}`}>{formatCurrency(profit)}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Income Details */}
          <div className="p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Income by Service
            </h3>
            {incomeByService.length === 0 ? (
              <p className="text-sm text-muted-foreground">No income in this period</p>
            ) : (
              <div className="space-y-2">
                {incomeByService.map(([svc, amt]) => (
                  <div key={svc} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{svc}</span>
                    <span className="font-semibold text-emerald-500">{formatCurrency(amt)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-border font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-emerald-500">{formatCurrency(income)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Expense Details */}
          <div className="p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Expense by Category
            </h3>
            {expenseByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses in this period</p>
            ) : (
              <div className="space-y-2">
                {expenseByCategory.map(([cat, amt]) => (
                  <div key={cat} className="flex justify-between items-center text-sm">
                    <span className="text-foreground">{cat}</span>
                    <span className="font-semibold text-red-500">{formatCurrency(amt)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-border font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-red-500">{formatCurrency(expense)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment Mode */}
        {Object.keys(byMode).length > 0 && (
          <div className="border-t border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">Income by Payment Mode</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PAYMENT_MODES.map((mode) => (
                <div key={mode} className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{mode}</p>
                  <p className="font-bold text-foreground mt-0.5">{formatCurrency(byMode[mode] ?? 0)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transactions list */}
        {filtered.length > 0 && (
          <div className="border-t border-border p-6">
            <h3 className="font-semibold text-foreground mb-3">All Transactions ({filtered.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Category</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Mode</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-t border-border/50">
                      <td className="px-3 py-2 text-foreground">{t.date}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.type === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-foreground">{t.category}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.paymentMode}</td>
                      <td className={`px-3 py-2 text-right font-semibold ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                        {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
          {shopName} &bull; Contact: {mobile} &bull; Developed By Mr Rohit
        </div>
      </div>
    </div>
  );
}
