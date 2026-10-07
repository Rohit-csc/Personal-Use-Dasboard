import { useMemo } from "react";
import { TrendingUp, TrendingDown, IndianRupee, Calendar, Users, Clock, Wallet, ArrowUpRight } from "lucide-react";
import { Transaction, Customer, PendingWork, filterByDateRange, sumIncome, sumExpense, formatCurrency, getDateRange, toDateString } from "../lib/store";

interface Props {
  transactions: Transaction[];
  customers: Customer[];
  pendingWorks: PendingWork[];
  openingCash: number;
}

export default function Dashboard({ transactions, customers, pendingWorks, openingCash }: Props) {
  const { start: todayStart, end: todayEnd } = getDateRange("today");
  const { start: ystStart, end: ystEnd } = getDateRange("yesterday");
  const { start: monthStart } = getDateRange("month");
  const yearStart = `${new Date().getFullYear()}-01-01`;

  const todayTx = useMemo(() => filterByDateRange(transactions, todayStart, todayEnd), [transactions, todayStart]);
  const ystTx = useMemo(() => filterByDateRange(transactions, ystStart, ystEnd), [transactions, ystStart]);
  const monthTx = useMemo(() => filterByDateRange(transactions, monthStart, todayEnd), [transactions, monthStart]);
  const yearTx = useMemo(() => filterByDateRange(transactions, yearStart, todayEnd), [transactions, yearStart]);

  const todayIncome = sumIncome(todayTx);
  const todayExpense = sumExpense(todayTx);
  const todayProfit = todayIncome - todayExpense;
  const ystProfit = sumIncome(ystTx) - sumExpense(ystTx);
  const monthProfit = sumIncome(monthTx) - sumExpense(monthTx);
  const yearProfit = sumIncome(yearTx) - sumExpense(yearTx);

  const closingCash = openingCash + todayIncome - todayExpense;
  const pendingCount = pendingWorks.filter((p) => p.status === "pending").length;

  // Top earning services
  const serviceEarnings = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === "income" && t.date >= monthStart).forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [transactions, monthStart]);

  // Payment mode breakdown today
  const paymentBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    todayTx.filter((t) => t.type === "income").forEach((t) => {
      map[t.paymentMode] = (map[t.paymentMode] ?? 0) + t.amount;
    });
    return map;
  }, [todayTx]);

  const StatCard = ({
    label, value, icon: Icon, sub, color = "primary", isProfit
  }: {
    label: string; value: string; icon: React.ElementType; sub?: string; color?: string; isProfit?: boolean
  }) => {
    const isNeg = isProfit && parseFloat(value.replace(/[^0-9.-]/g, "")) < 0;
    return (
      <div className="rounded-xl border border-border bg-card p-4 flex items-start gap-3 hover:border-primary/30 transition-colors">
        <div className={`p-2 rounded-lg bg-${color === "destructive" ? "destructive" : isNeg ? "red-500" : "primary"}/10 flex-shrink-0`}>
          <Icon size={18} className={color === "destructive" || isNeg ? "text-red-500" : "text-primary"} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className={`text-lg font-bold ${isProfit ? (isNeg ? "text-red-500" : "text-emerald-500") : "text-foreground"}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Today Income" value={formatCurrency(todayIncome)} icon={TrendingUp} sub={`${todayTx.filter(t=>t.type==="income").length} entries`} />
        <StatCard label="Today Expense" value={formatCurrency(todayExpense)} icon={TrendingDown} color="destructive" sub={`${todayTx.filter(t=>t.type==="expense").length} entries`} />
        <StatCard label="Today Profit" value={formatCurrency(todayProfit)} icon={IndianRupee} isProfit />
        <StatCard label="Yesterday Profit" value={formatCurrency(ystProfit)} icon={Calendar} isProfit />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Monthly Profit" value={formatCurrency(monthProfit)} icon={TrendingUp} isProfit sub="This month" />
        <StatCard label="Yearly Profit" value={formatCurrency(yearProfit)} icon={TrendingUp} isProfit sub={`${new Date().getFullYear()}`} />
        <StatCard label="Total Customers" value={customers.length.toString()} icon={Users} sub="All time" />
        <StatCard label="Pending Works" value={pendingCount.toString()} icon={Clock} color={pendingCount > 0 ? "destructive" : "primary"} sub="Open tasks" />
      </div>

      {/* Cash In Hand */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="text-primary" size={18} />
          <h2 className="font-semibold text-foreground">Cash In Hand</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Opening Cash", val: openingCash, color: "text-foreground" },
            { label: "Today Income", val: todayIncome, color: "text-emerald-500" },
            { label: "Today Expense", val: todayExpense, color: "text-red-500" },
            { label: "Closing Balance", val: closingCash, color: closingCash >= 0 ? "text-emerald-500" : "text-red-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center">
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className={`text-base font-bold ${color}`}>{formatCurrency(val)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <ArrowUpRight className="text-primary" size={16} />
            Recent Transactions
          </h2>
          {transactions.slice(0, 8).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 8).map((t) => (
                <div key={t.id} data-testid={`tx-row-${t.id}`} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <div className="min-w-0 mr-2">
                    <p className="text-sm font-medium text-foreground truncate">{t.category}</p>
                    <p className="text-xs text-muted-foreground">{t.date} · {t.paymentMode}</p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${t.type === "income" ? "text-emerald-500" : "text-red-500"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Top Earning Services */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground mb-3">Top Services (This Month)</h2>
            {serviceEarnings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2">
                {serviceEarnings.map(([service, amount], i) => (
                  <div key={service} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-0.5">
                        <span className="font-medium text-foreground truncate">{service}</span>
                        <span className="text-emerald-500 font-semibold ml-2 flex-shrink-0">{formatCurrency(amount)}</span>
                      </div>
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, (amount / (serviceEarnings[0]?.[1] ?? 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Mode Breakdown */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground mb-3">Today Payment Modes</h2>
            {Object.keys(paymentBreakdown).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No income today</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(paymentBreakdown).map(([mode, amount]) => (
                  <div key={mode} className="rounded-lg bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">{mode}</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(amount)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
