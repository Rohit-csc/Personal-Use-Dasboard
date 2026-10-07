export const SERVICE_CATEGORIES = [
  "Photocopy",
  "Color Print",
  "Black & White Print",
  "Passport Photo",
  "Lamination",
  "Online Form Fillup",
  "Account Opening",
  "Cash Withdrawal",
  "PAN Card",
  "Aadhaar Service",
  "Voter ID",
  "Ayushman Card",
  "Birth Certificate",
  "Death Certificate",
  "Electricity Bill",
  "Mobile Recharge",
  "DTH Recharge",
  "Train Ticket",
  "Flight Ticket",
  "Insurance",
  "CSC Service",
  "Government Service",
  "Other",
] as const;

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity Bill",
  "Internet",
  "Employee Salary",
  "Maintenance",
  "Equipment Purchase",
  "Misc Expense",
] as const;

export const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Wallet"] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  customerName?: string;
  notes?: string;
  date: string;
  category: string;
  paymentMode: PaymentMode;
  receiptNumber?: string;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  totalDue: number;
  payments: CustomerPayment[];
  createdAt: string;
}

export interface PendingWork {
  id: string;
  service: string;
  customerName: string;
  details?: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed";
  createdAt: string;
  completedAt?: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  openingCash: number;
  totalIncome: number;
  totalExpense: number;
  closingCash: number;
  createdAt: string;
}

export interface AppSettings {
  pin: string;
  darkMode: boolean;
  openingCash: number;
  serviceRates: Record<string, number>;
  shopName: string;
  mobile: string;
  developer: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  pin: "482681",
  darkMode: true,
  openingCash: 0,
  serviceRates: {},
  shopName: "Rohit CSC Center",
  mobile: "8340507757",
  developer: "Mr Rohit",
};

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function generateReceiptNumber(index: number): string {
  const year = new Date().getFullYear();
  return `RCS-${year}-${String(index).padStart(4, "0")}`;
}

export function toDateString(d: Date = new Date()): string {
  return d.toISOString().split("T")[0];
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDateRange(type: "today" | "yesterday" | "week" | "month" | "year" | "custom", customStart?: string, customEnd?: string) {
  const today = toDateString();
  const now = new Date();

  if (type === "today") return { start: today, end: today };

  if (type === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const s = toDateString(y);
    return { start: s, end: s };
  }

  if (type === "week") {
    const w = new Date(now);
    w.setDate(w.getDate() - 6);
    return { start: toDateString(w), end: today };
  }

  if (type === "month") {
    const m = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toDateString(m), end: today };
  }

  if (type === "year") {
    const y = new Date(now.getFullYear(), 0, 1);
    return { start: toDateString(y), end: today };
  }

  return { start: customStart ?? today, end: customEnd ?? today };
}

export function filterByDateRange(transactions: Transaction[], start: string, end: string) {
  return transactions.filter((t) => t.date >= start && t.date <= end);
}

export function sumIncome(transactions: Transaction[]) {
  return transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
}

export function sumExpense(transactions: Transaction[]) {
  return transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
}
