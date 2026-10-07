import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from "lucide-react";
import { Transaction, filterByDateRange, sumIncome, sumExpense, formatCurrency, getDateRange } from "../lib/store";

interface Props {
  transactions: Transaction[];
}

export default function PrevDaySummary({ transactions }: Props) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("csc_prev_day_seen");
    if (!seen) {
      setOpen(true);
      sessionStorage.setItem("csc_prev_day_seen", "1");
    }
  }, []);

  const calc = (start: string, end: string) => {
    const txs = filterByDateRange(transactions, start, end);
    const income = sumIncome(txs);
    const expense = sumExpense(txs);
    return { income, expense, profit: income - expense };
  };

  const yesterday = calc(getDateRange("yesterday").start, getDateRange("yesterday").end);
  const week = calc(getDateRange("week").start, getDateRange("week").end);
  const month = calc(getDateRange("month").start, getDateRange("month").end);

  const lastYear = (() => {
    const now = new Date();
    const start = `${now.getFullYear() - 1}-01-01`;
    const end = `${now.getFullYear() - 1}-12-31`;
    return calc(start, end);
  })();

  if (!open) return null;

  const ProfitBadge = ({ profit }: { profit: number }) => {
    if (profit > 0) return (
      <span className="flex items-center gap-1 text-emerald-500 font-semibold text-sm">
        <TrendingUp size={14} /> {formatCurrency(profit)}
      </span>
    );
    if (profit < 0) return (
      <span className="flex items-center gap-1 text-red-500 font-semibold text-sm">
        <TrendingDown size={14} /> {formatCurrency(Math.abs(profit))} Loss
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-muted-foreground font-semibold text-sm">
        <Minus size={14} /> Break Even
      </span>
    );
  };

  const Row = ({ label, income, expense, profit }: { label: string; income: number; expense: number; profit: number }) => (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs text-muted-foreground mb-2 font-medium">{label}</p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Income</p>
          <p className="text-sm font-semibold text-emerald-500">{formatCurrency(income)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Expense</p>
          <p className="text-sm font-semibold text-red-500">{formatCurrency(expense)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Profit</p>
          <ProfitBadge profit={profit} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm no-print">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-sidebar/50 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground">Previous Day Summary</h3>
            <p className="text-xs text-muted-foreground">Rohit CSC Center</p>
          </div>
          <button
            data-testid="prev-day-close"
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <Row
            label="Yesterday"
            income={yesterday.income}
            expense={yesterday.expense}
            profit={yesterday.profit}
          />

          {expanded && (
            <>
              <Row label="Last 7 Days" income={week.income} expense={week.expense} profit={week.profit} />
              <Row label="This Month" income={month.income} expense={month.expense} profit={month.profit} />
              <Row label={`Last Year (${new Date().getFullYear() - 1})`} income={lastYear.income} expense={lastYear.expense} profit={lastYear.profit} />
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              data-testid="prev-day-view-more"
              onClick={() => setExpanded((e) => !e)}
              className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              {expanded ? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> View More</>}
            </button>
            <button
              data-testid="prev-day-close-btn"
              onClick={() => setOpen(false)}
              className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
