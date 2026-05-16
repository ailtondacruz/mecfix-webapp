import { auth } from '../../../services/firebase';
import type { WorkshopBillingDetails, WorkshopBillingOverview } from '../../../shared';

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

export async function getBillingOverview(): Promise<WorkshopBillingOverview> {
  const token = await getAuthToken();
  const response = await fetch('/api/workshops/billing/overview', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao carregar assinaturas');
  }

  return payload.data as WorkshopBillingOverview;
}

export async function getWorkshopBillingDetails(workshopId: string): Promise<WorkshopBillingDetails> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}/billing/details`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao carregar detalhes da oficina');
  }

  return payload.data as WorkshopBillingDetails;
}

export async function markInstallmentAsPaid(workshopId: string, periodKey: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}/billing/installments/${periodKey}/pay`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao marcar parcela como paga');
  }
}

export async function markInstallmentAsUnpaid(workshopId: string, periodKey: string): Promise<void> {
  const token = await getAuthToken();
  const response = await fetch(`/api/workshops/${workshopId}/billing/installments/${periodKey}/unpay`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao marcar parcela como não paga');
  }
}
