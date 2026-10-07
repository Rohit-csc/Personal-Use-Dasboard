import { Switch, Route, Router as WouterRouter } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Customers from "./pages/Customers";
import PendingWorkPage from "./pages/PendingWork";
import Reports from "./pages/Reports";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/Settings";
import PrevDaySummary from "./components/PrevDaySummary";
import { useAppData } from "./hooks/useAppData";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { toDateString } from "./lib/store";

const queryClient = new QueryClient();

/*
 * CRITICAL: All page components must be rendered as JSX children of <Route>,
 * NOT as `component={() => <Page />}`.
 *
 * Using `component={() => ...}` creates a new function reference on every
 * render of AppInner, causing wouter to unmount+remount the page component
 * on every state change — which destroys input focus after every keystroke.
 *
 * The children pattern keeps the same component instance alive across renders.
 */

function AppInner() {
  const [loggedIn, setLoggedIn] = useLocalStorage<boolean>("csc_session", false);
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("csc_dark", true);

  const {
    transactions, customers, pendingWorks, settings,
    addTransaction, updateTransaction, deleteTransaction,
    addCustomer, updateCustomer, deleteCustomer, addCustomerPayment,
    addPendingWork, updatePendingWork, completePendingWork, deletePendingWork,
    addDailyClosing, updateSettings, exportBackup, importBackup,
  } = useAppData();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (settings.darkMode !== undefined) setDarkMode(settings.darkMode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    updateSettings({ darkMode: next });
  };

  const handleDailyClose = () => {
    const today = toDateString();
    const todayTx = transactions.filter((t) => t.date === today);
    const income = todayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = todayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    addDailyClosing({
      date: today,
      openingCash: settings.openingCash,
      totalIncome: income,
      totalExpense: expense,
      closingCash: settings.openingCash + income - expense,
    });
  };

  const pendingCount = pendingWorks.filter((p) => p.status === "pending").length;

  if (!loggedIn) {
    return (
      <Login
        settings={settings}
        onLogin={() => setLoggedIn(true)}
      />
    );
  }

  return (
    <Layout
      darkMode={darkMode}
      onToggleDark={toggleDark}
      onLogout={() => setLoggedIn(false)}
      pendingCount={pendingCount}
      shopName={settings.shopName}
    >
      <PrevDaySummary transactions={transactions} />
      <Switch>
        {/* ↓ Children pattern keeps component instances stable → no focus loss */}
        <Route path="/">
          <Dashboard
            transactions={transactions}
            customers={customers}
            pendingWorks={pendingWorks}
            openingCash={settings.openingCash}
          />
        </Route>
        <Route path="/income">
          <Income
            transactions={transactions}
            serviceRates={settings.serviceRates}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
          />
        </Route>
        <Route path="/expense">
          <Expense
            transactions={transactions}
            onAdd={addTransaction}
            onUpdate={updateTransaction}
            onDelete={deleteTransaction}
          />
        </Route>
        <Route path="/customers">
          <Customers
            customers={customers}
            onAdd={addCustomer}
            onDelete={deleteCustomer}
            onAddPayment={addCustomerPayment}
            onUpdate={updateCustomer}
          />
        </Route>
        <Route path="/pending">
          <PendingWorkPage
            pendingWorks={pendingWorks}
            onAdd={addPendingWork}
            onComplete={completePendingWork}
            onDelete={deletePendingWork}
            onUpdate={updatePendingWork}
          />
        </Route>
        <Route path="/reports">
          <Reports
            transactions={transactions}
            shopName={settings.shopName}
            mobile={settings.mobile}
          />
        </Route>
        <Route path="/analytics">
          <Analytics transactions={transactions} />
        </Route>
        <Route path="/settings">
          <SettingsPage
            settings={settings}
            transactions={transactions}
            onUpdate={updateSettings}
            onExport={exportBackup}
            onImport={importBackup}
            onDailyClose={handleDailyClose}
          />
        </Route>
        <Route>
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Page not found</p>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppInner />
      </WouterRouter>
    </QueryClientProvider>
  );
}
