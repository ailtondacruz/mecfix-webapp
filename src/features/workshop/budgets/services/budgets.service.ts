import { auth } from '../../../../services/firebase';
import type { Budget } from '../../../../shared';

export interface BudgetLineInput {
  description: string;
  unitPrice: number;
  type: 'service' | 'part';
}

export interface CreateBudgetInput {
  customerName: string;
  vehicleName: string;
  vehiclePlate: string;
  validityDays: number;
  notes?: string;
  items: BudgetLineInput[];
}

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado');
  }

  return currentUser.getIdToken();
}

async function readJsonSafely(response: Response): Promise<any> {
  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function listBudgets(): Promise<Budget[]> {
  const token = await getAuthToken();
  const response = await fetch('/api/budgets', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao carregar orçamentos');
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function createBudget(input: CreateBudgetInput): Promise<Budget> {
  const token = await getAuthToken();
  const response = await fetch('/api/budgets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...input,
      items: input.items.map((item) => ({
        ...item,
        quantity: 1,
      })),
    }),
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao salvar orçamento');
  }

  if (!payload?.data) {
    throw new Error('Resposta inválida ao salvar orçamento');
  }

  return payload.data as Budget;
}

export async function updateBudget(budgetId: string, input: CreateBudgetInput): Promise<Budget> {
  const token = await getAuthToken();
  const response = await fetch(`/api/budgets/${budgetId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      ...input,
      items: input.items.map((item) => ({ ...item, quantity: 1 })),
    }),
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao atualizar orçamento');
  }

  if (!payload?.data) {
    throw new Error('Resposta inválida ao atualizar orçamento');
  }

  return payload.data as Budget;
}

export async function deleteBudget(budgetId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/budgets/${budgetId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload = await readJsonSafely(response);
    throw new Error(payload?.message || payload?.error || 'Falha ao excluir orçamento');
  }
}

export async function downloadBudgetPdf(budgetId: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/budgets/${budgetId}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Falha ao gerar PDF');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
