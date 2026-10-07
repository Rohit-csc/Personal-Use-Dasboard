import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Award, AlertCircle } from "lucide-react";
import { Transaction, filterByDateRange, sumIncome, sumExpense, formatCurrency, toDateString } from "../lib/store";

interface Props {
  transactions: Transaction[];
}

function profitColor(v: number) {
  return v >= 0 ? "#10b981" : "#ef4444";
}

export default function Analytics({ transactions }: Props) {
  const today = new Date();

  const dailyData = useMemo(() => {
    const days: { date: string; income: number; expense: number; profit: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = toDateString(d);
      const tx = filterByDateRange(transactions, ds, ds);
      const income = sumIncome(tx);
      const expense = sumExpense(tx);
      days.push({ date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), income, expense, profit: income - expense });
    }
    return days;
  }, [transactions]);

  const weeklyData = useMemo(() => {
    const weeks: { week: string; income: number; expense: number; profit: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const end = new Date(today);
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const tx = filterByDateRange(transactions, toDateString(start), toDateString(end));
      const income = sumIncome(tx);
      const expense = sumExpense(tx);
      weeks.push({
        week: `W${start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`,
        income, expense, profit: income - expense,
      });
    }
    return weeks;
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const months: { month: string; income: number; expense: number; profit: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const start = toDateString(d);
      const end = toDateString(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      const tx = filterByDateRange(transactions, start, end);
      const income = sumIncome(tx);
      const expense = sumExpense(tx);
      months.push({ month: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), income, expense, profit: income - expense });
    }
    return months;
  }, [transactions]);

  const yearlyData = useMemo(() => {
    const years: { year: string; income: number; expense: number; profit: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const y = today.getFullYear() - i;
      const tx = filterByDateRange(transactions, `${y}-01-01`, `${y}-12-31`);
      const income = sumIncome(tx);
      const expense = sumExpense(tx);
      years.push({ year: String(y), income, expense, profit: income - expense });
    }
    return years;
  }, [transactions]);

  // Service earnings this year
  const serviceEarnings = useMemo(() => {
    const map: Record<string, number> = {};
    const yearStart = `${today.getFullYear()}-01-01`;
    transactions.filter((t) => t.type === "income" && t.date >= yearStart).forEach((t) => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  // Business insights
  const insights = useMemo(() => {
    const dayMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};
    transactions.forEach((t) => {
      const profit = t.type === "income" ? t.amount : -t.amount;
      dayMap[t.date] = (dayMap[t.date] ?? 0) + profit;
      const month = t.date.slice(0, 7);
      monthMap[month] = (monthMap[month] ?? 0) + profit;
    });
    const dayEntries = Object.entries(dayMap).sort((a, b) => b[1] - a[1]);
    const monthEntries = Object.entries(monthMap).sort((a, b) => b[1] - a[1]);
    return {
      bestDay: dayEntries[0],
      worstDay: dayEntries[dayEntries.length - 1],
      bestMonth: monthEntries[0],
      worstMonth: monthEntries[monthEntries.length - 1],
    };
  }, [transactions]);

  // Month-to-Month comparison
  const thisMonthIncome = sumIncome(filterByDateRange(transactions, toDateString(new Date(today.getFullYear(), today.getMonth(), 1)), toDateString(today)));
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
  const lastMonthIncome = sumIncome(filterByDateRange(transactions, toDateString(lastMonthStart), toDateString(lastMonthEnd)));
  const growthPct = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome * 100).toFixed(1) : null;

  const tooltipStyle = {
    backgroundColor: "hsl(222 47% 12%)",
    border: "1px solid hsl(217 33% 22%)",
    borderRadius: "8px",
    color: "hsl(210 40% 96%)",
    fontSize: "12px",
  };

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="font-semibold text-foreground mb-4">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Business performance overview</p>
      </div>

      {/* Growth Banner */}
      {growthPct !== null && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${Number(growthPct) >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
          {Number(growthPct) >= 0 ? <TrendingUp className="text-emerald-500" size={20} /> : <TrendingDown className="text-red-500" size={20} />}
          <div>
            <p className="text-sm font-semibold text-foreground">Month-over-Month Growth</p>
            <p className="text-xs text-muted-foreground">
              This month: {formatCurrency(thisMonthIncome)} vs Last month: {formatCurrency(lastMonthIncome)}
              <span className={`ml-2 font-bold ${Number(growthPct) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {Number(growthPct) >= 0 ? "+" : ""}{growthPct}%
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Business Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Best Day", icon: Award, color: "text-emerald-500", val: insights.bestDay ? `${insights.bestDay[0]} (${formatCurrency(insights.bestDay[1])})` : "N/A" },
          { label: "Worst Day", icon: AlertCircle, color: "text-red-500", val: insights.worstDay ? `${insights.worstDay[0]} (${formatCurrency(insights.worstDay[1])})` : "N/A" },
          { label: "Best Month", icon: TrendingUp, color: "text-emerald-500", val: insights.bestMonth ? `${insights.bestMonth[0]} (${formatCurrency(insights.bestMonth[1])})` : "N/A" },
          { label: "Top Service", icon: Award, color: "text-primary", val: serviceEarnings[0] ? `${serviceEarnings[0][0]}` : "N/A" },
        ].map(({ label, icon: Icon, color, val }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={14} className={color} />
              <p className="text-xs text-muted-foreground font-medium">{label}</p>
            </div>
            <p className="text-xs font-semibold text-foreground leading-snug">{val}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <ChartCard title="Daily Profit (Last 30 Days)">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(val) => [formatCurrency(val as number), ""]} />
            <ReferenceLine y={0} stroke="hsl(217 33% 30%)" />
            <Bar dataKey="profit" name="Profit" radius={[3, 3, 0, 0]}
              fill="#10b981"
              label={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartCard title="Income vs Expense (Monthly)">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val) => [formatCurrency(val as number), ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Yearly Comparison">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={yearlyData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: "hsl(215 20% 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(val) => [formatCurrency(val as number), ""]} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <ChartCard title="Weekly Profit Trend">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weeklyData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 20%)" />
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: "hsl(215 20% 55%)" }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(215 20% 55%)" }} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(val) => [formatCurrency(val as number), ""]} />
            <ReferenceLine y={0} stroke="hsl(217 33% 30%)" />
            <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Service Rankings */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="font-semibold text-foreground mb-4">Service-wise Earnings (This Year)</h2>
        {serviceEarnings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No income data yet</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {serviceEarnings.map(([svc, amt], i) => (
              <div key={svc} className="flex items-center gap-2">
                <span className={`text-xs font-bold w-5 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm mb-0.5">
                    <span className="font-medium text-foreground truncate">{svc}</span>
                    <span className="text-emerald-500 font-semibold ml-2">{formatCurrency(amt)}</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (amt / (serviceEarnings[0]?.[1] ?? 1)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
