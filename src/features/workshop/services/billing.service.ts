import { auth } from '../../../services/firebase';
import type { WorkshopBillingDetails, WorkshopBillingInstallment } from '../../../shared';

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

export async function getMyBilling(): Promise<WorkshopBillingDetails> {
  const token = await getAuthToken();
  const response = await fetch('/api/workshops/me/billing', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao carregar assinatura');
  }

  return payload.data as WorkshopBillingDetails;
}

export async function getMyInstallments(): Promise<WorkshopBillingInstallment[]> {
  const token = await getAuthToken();
  const response = await fetch('/api/workshops/me/billing/installments', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Falha ao carregar parcelas');
  }

  return Array.isArray(payload?.data) ? payload.data as WorkshopBillingInstallment[] : [];
}
