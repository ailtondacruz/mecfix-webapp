import { getAuthToken, readJsonSafely } from '../../../../shared';
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

export interface ListBudgetsFilters {
  year?: number;
  month?: number;
  q?: string;
  status?: 'all' | 'pending' | 'approved' | 'rejected' | 'expired';
}

export interface BudgetMonthlyStats {
  total: number;
  totalValue: number;
  pending: number;
  approved: number;
  approvedValue: number;
}

export async function listBudgets(filters: ListBudgetsFilters = {}): Promise<Budget[]> {
  const token = await getAuthToken();
  const params = new URLSearchParams();

  if (filters.year !== undefined) params.set('year', String(filters.year));
  if (filters.month !== undefined) params.set('month', String(filters.month));
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.status && filters.status !== 'all') params.set('status', filters.status);

  const endpoint = params.size > 0 ? `/api/budgets?${params.toString()}` : '/api/budgets';

  const response = await fetch(endpoint, {
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

export async function getMonthlyBudgetStats(year: number, month: number): Promise<BudgetMonthlyStats> {
  const token = await getAuthToken();
  const response = await fetch(`/api/budgets/stats/monthly?year=${year}&month=${month}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao carregar estatísticas');
  }

  return (payload?.data ?? {
    total: 0,
    totalValue: 0,
    pending: 0,
    approved: 0,
    approvedValue: 0,
  }) as BudgetMonthlyStats;
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
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ── Public (client-facing, no auth) ───────────────────────────────────────

export async function getBudgetByToken(shareToken: string): Promise<Budget> {
  const response = await fetch(`/api/budgets/public/${shareToken}`);
  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Orçamento não encontrado');
  }

  return payload.data as Budget;
}

export async function respondToBudget(
  shareToken: string,
  action: 'approve' | 'reject',
): Promise<Budget> {
  const response = await fetch(`/api/budgets/public/${shareToken}/respond`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao responder orçamento');
  }

  return payload.data as Budget;
}
