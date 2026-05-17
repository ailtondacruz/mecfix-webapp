import { getAuthToken } from '../../../../shared';
import type { FinancialEntry, MonthlySummary } from '../../../../shared';

export interface CreateEntryInput {
  type: 'revenue' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod?: string;
  budgetId?: string;
  budgetNumber?: string;
  notes?: string;
}

export interface UpdateEntryInput {
  type?: 'revenue' | 'expense';
  amount?: number;
  description?: string;
  category?: string;
  date?: string;
  paymentMethod?: string;
  notes?: string;
}

export async function getAnnualSummary(year: number): Promise<MonthlySummary[]> {
  const token = await getAuthToken();
  const res = await fetch(`/api/financials/summary?year=${year}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status} ao buscar resumo anual`);
  }
  const body = await res.json();
  return body.data as MonthlySummary[];
}

export async function getMonthlyRevenue(year: number, month: number): Promise<number> {
  const token = await getAuthToken();
  const res = await fetch(`/api/financials/revenue/monthly?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status} ao buscar receita mensal`);
  }
  const body = await res.json();
  return Number(body.data?.revenue ?? 0);
}

export async function getMonthlyEntries(year: number, month: number): Promise<FinancialEntry[]> {
  const token = await getAuthToken();
  const res = await fetch(`/api/financials?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `HTTP ${res.status} ao buscar lançamentos`);
  }
  const body = await res.json();
  return body.data as FinancialEntry[];
}

export async function createEntry(dto: CreateEntryInput): Promise<FinancialEntry> {
  const token = await getAuthToken();
  const res = await fetch('/api/financials', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao criar lançamento');
  }
  const body = await res.json();
  return body.data as FinancialEntry;
}

export async function deleteEntry(entryId: string): Promise<void> {
  const token = await getAuthToken();
  const res = await fetch(`/api/financials/${entryId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erro ao excluir lançamento');
}

export async function updateEntry(entryId: string, dto: UpdateEntryInput): Promise<FinancialEntry> {
  const token = await getAuthToken();
  const res = await fetch(`/api/financials/${entryId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? 'Erro ao atualizar lançamento');
  }
  const body = await res.json();
  return body.data as FinancialEntry;
}

export async function downloadReportPdf(year: number, month: number): Promise<void> {
  const token = await getAuthToken();
  const res = await fetch(`/api/financials/report/pdf?year=${year}&month=${month}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Erro ao baixar relatório');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const monthsPt = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  a.href = url;
  a.download = `financeiro-${monthsPt[month - 1]}-${year}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const PAYMENT_LABELS: Record<string, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito',
  transferencia: 'Transferência',
  boleto: 'Boleto',
};

const MONTHS_PT_LOWER = [
  'janeiro','fevereiro','marco','abril','maio','junho',
  'julho','agosto','setembro','outubro','novembro','dezembro',
];

export function downloadCSV(entries: FinancialEntry[], year: number, month: number): void {
  const BOM = '\uFEFF'; // UTF-8 BOM so Excel opens with correct encoding

  const header = ['Data','Descrição','Categoria','Tipo','Forma de Pagamento','Valor (R$)'];

  const rows = entries.map(e => {
    const [y, m, d] = e.date.split('-');
    const date = `${d}/${m}/${y}`;
    const type = e.type === 'revenue' ? 'Receita' : 'Despesa';
    const payment = e.paymentMethod ? (PAYMENT_LABELS[e.paymentMethod] ?? e.paymentMethod) : '';
    // Format amount as Brazilian decimal (comma separator) so Excel parses it as number
    const amount = e.amount.toFixed(2).replace('.', ',');
    return [date, e.description, e.category, type, payment, amount];
  });

  const csvContent =
    BOM +
    [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(';'))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `financeiro-${MONTHS_PT_LOWER[month - 1]}-${year}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
