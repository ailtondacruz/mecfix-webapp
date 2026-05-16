import { auth } from '../../../services/firebase';
import type { WorkshopBillingOverview } from '../../../shared';

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
