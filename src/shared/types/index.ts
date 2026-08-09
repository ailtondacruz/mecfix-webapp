// Multi-tenant types
export interface Workshop {
  workshopId: string;
  name: string;
  address: string;
  documentType: 'cpf' | 'cnpj';
  documentNumber: string;
  email: string;
  phone: string;
  monthlyFee: number;
  billingDueDay: number;
  logoUrl?: string;
  status: 'active' | 'blocked' | 'deleted';
  billingStatus: 'pending' | 'active' | 'overdue' | 'suspended';
  billingDueAt: string;
  lastPaymentAt?: string;
  lastPaymentAmount?: number;
  lastPaymentMethod?: 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'transferencia' | 'boleto' | 'manual';
  suspendedAt?: string;
  suspensionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  userId: string;
  workshopId: string;
  name: string;
  email: string;
  role: 'root' | 'admin' | 'owner' | 'mechanic' | 'attendant';
  permissions: string[];
  createdAt: Date;
}

export interface Customer {
  customerId: string;
  workshopId: string;
  name: string;
  phone: string;
  email: string;
  createdAt: Date;
}

export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  type: 'service' | 'part';
}

export type BudgetStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface Budget {
  budgetId: string;
  budgetNumber: string;
  workshopId: string;
  shareToken: string;
  customerName: string;
  vehicleName: string;
  vehiclePlate: string;
  items: BudgetItem[];
  subtotal: number;
  total: number;
  validityDays: number;
  validUntil: string;
  status: BudgetStatus;
  notes?: string;
  pdfUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
  workshop?: Workshop;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ── Financial module ────────────────────────────────────────────────
export type EntryType = 'revenue' | 'expense';
export type PaymentMethod = 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'transferencia' | 'boleto';

export interface FinancialEntry {
  entryId: string;
  workshopId: string;
  type: EntryType;
  amount: number;
  description: string;
  category: string;
  paymentMethod?: PaymentMethod;
  date: string; // YYYY-MM-DD
  budgetId?: string;
  budgetNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlySummary {
  month: number; // 1–12
  year: number;
  revenue: number;
  expense: number;
  balance: number;
  entryCount: number;
}

export type WorkshopBillingState = 'paid' | 'due_soon' | 'overdue' | 'pending' | 'suspended';

export interface WorkshopBillingPayment {
  paymentId: string;
  workshopId: string;
  amount: number;
  method: 'pix' | 'dinheiro' | 'cartao_debito' | 'cartao_credito' | 'transferencia' | 'boleto' | 'manual';
  reference: string;
  paidAt: string;
  createdBy: string;
  createdAt: string;
}

export interface WorkshopBillingView extends Workshop {
  billingState: WorkshopBillingState;
  dueInDays: number | null;
}

export interface WorkshopBillingSummary {
  total: number;
  paid: number;
  dueSoon: number;
  overdue: number;
  pending: number;
  suspended: number;
}

export interface WorkshopBillingOverview {
  summary: WorkshopBillingSummary;
  workshops: WorkshopBillingView[];
}

export interface WorkshopBillingDetails {
  workshop: WorkshopBillingView;
  ownerEmail?: string;
}

