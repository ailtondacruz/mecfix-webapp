// Multi-tenant types
export interface Workshop {
  workshopId: string;
  name: string;
  address: string;
  documentType: 'cpf' | 'cnpj';
  documentNumber: string;
  email: string;
  phone: string;
  logoUrl?: string;
  status: 'active' | 'blocked';
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

export interface Vehicle {
  vehicleId: string;
  workshopId: string;
  customerId: string;
  plate: string;
  model: string;
  year: number;
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

export interface Budget {
  budgetId: string;
  workshopId: string;
  customerName: string;
  vehicleName: string;
  vehiclePlate: string;
  items: BudgetItem[];
  subtotal: number;
  total: number;
  validityDays: number;
  validUntil: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired';
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
