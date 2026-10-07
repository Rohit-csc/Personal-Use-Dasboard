import { useLocalStorage } from "./useLocalStorage";
import {
  Transaction,
  Customer,
  PendingWork,
  DailyClosing,
  AppSettings,
  DEFAULT_SETTINGS,
  generateId,
  generateReceiptNumber,
  toDateString,
} from "../lib/store";

export function useAppData() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("csc_transactions", []);
  const [customers, setCustomers] = useLocalStorage<Customer[]>("csc_customers", []);
  const [pendingWorks, setPendingWorks] = useLocalStorage<PendingWork[]>("csc_pending", []);
  const [dailyClosings, setDailyClosings] = useLocalStorage<DailyClosing[]>("csc_closings", []);
  const [settings, setSettings] = useLocalStorage<AppSettings>("csc_settings", DEFAULT_SETTINGS);

  // Transactions
  const addTransaction = (data: Omit<Transaction, "id" | "createdAt" | "receiptNumber"> & { type: "income" | "expense" }) => {
    const incomeCount = transactions.filter((t) => t.type === "income").length + 1;
    const tx: Transaction = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      receiptNumber: data.type === "income" ? generateReceiptNumber(incomeCount) : undefined,
    };
    setTransactions((prev) => [tx, ...prev]);
    return tx;
  };

  const updateTransaction = (id: string, data: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Customers
  const addCustomer = (data: Omit<Customer, "id" | "createdAt" | "payments" | "totalDue">) => {
    const c: Customer = { ...data, id: generateId(), payments: [], totalDue: 0, createdAt: new Date().toISOString() };
    setCustomers((prev) => [c, ...prev]);
    return c;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const addCustomerPayment = (customerId: string, amount: number, notes?: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== customerId) return c;
        const payment = { id: generateId(), date: toDateString(), amount, notes };
        const totalPaid = c.payments.reduce((s, p) => s + p.amount, 0) + amount;
        return { ...c, payments: [...c.payments, payment], totalDue: Math.max(0, c.totalDue - amount) };
      })
    );
  };

  // Pending Work
  const addPendingWork = (data: Omit<PendingWork, "id" | "createdAt" | "status">) => {
    const pw: PendingWork = { ...data, id: generateId(), status: "pending", createdAt: new Date().toISOString() };
    setPendingWorks((prev) => [pw, ...prev]);
    return pw;
  };

  const updatePendingWork = (id: string, data: Partial<PendingWork>) => {
    setPendingWorks((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
  };

  const completePendingWork = (id: string) => {
    setPendingWorks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "completed", completedAt: new Date().toISOString() } : p))
    );
  };

  const deletePendingWork = (id: string) => {
    setPendingWorks((prev) => prev.filter((p) => p.id !== id));
  };

  // Daily Closing
  const addDailyClosing = (data: Omit<DailyClosing, "id" | "createdAt">) => {
    const closing: DailyClosing = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setDailyClosings((prev) => [closing, ...prev]);
    return closing;
  };

  // Settings
  const updateSettings = (data: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...data }));
  };

  // Backup / Restore
  const exportBackup = () => {
    const backup = {
      transactions,
      customers,
      pendingWorks,
      dailyClosings,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rohit-csc-backup-${toDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.transactions) setTransactions(data.transactions);
          if (data.customers) setCustomers(data.customers);
          if (data.pendingWorks) setPendingWorks(data.pendingWorks);
          if (data.dailyClosings) setDailyClosings(data.dailyClosings);
          if (data.settings) setSettings(data.settings);
          resolve();
        } catch {
          reject(new Error("Invalid backup file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  return {
    transactions,
    customers,
    pendingWorks,
    dailyClosings,
    settings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomerPayment,
    addPendingWork,
    updatePendingWork,
    completePendingWork,
    deletePendingWork,
    addDailyClosing,
    updateSettings,
    exportBackup,
    importBackup,
  };
}
