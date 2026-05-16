import { auth } from '../../../../services/firebase';

export interface Customer {
  customerId: string;
  workshopId: string;
  name: string;
  contact: string;
  email?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  contact: string;
  email?: string;
  notes?: string;
}

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Usuário não autenticado');
  return currentUser.getIdToken();
}

async function readJsonSafely(response: Response): Promise<any> {
  const text = await response.text();
  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function listCustomers(search = ''): Promise<Customer[]> {
  const token = await getAuthToken();
  const query = search.trim();
  const endpoint = query ? `/api/customers?q=${encodeURIComponent(query)}` : '/api/customers';

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao carregar clientes');
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function createCustomer(input: CreateCustomerInput): Promise<Customer> {
  const token = await getAuthToken();
  const response = await fetch('/api/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao cadastrar cliente');
  }

  return payload.data as Customer;
}

export async function updateCustomer(customerId: string, input: CreateCustomerInput): Promise<Customer> {
  const token = await getAuthToken();
  const response = await fetch(`/api/customers/${customerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao atualizar cliente');
  }

  return payload.data as Customer;
}

export async function deleteCustomer(customerId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/customers/${customerId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload = await readJsonSafely(response);
    throw new Error(payload?.message || payload?.error || 'Falha ao excluir cliente');
  }
}
