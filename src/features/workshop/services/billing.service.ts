import { buildHttpError, getAuthToken, readJsonSafely } from '../../../shared';
import type { WorkshopBillingDetails } from '../../../shared';

export async function getMyBilling(): Promise<WorkshopBillingDetails> {
  const token = await getAuthToken();
  const response = await fetch('/api/workshops/me/billing', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = await readJsonSafely(response);
  if (!response.ok) {
    throw await buildHttpError(response, 'Falha ao carregar assinatura.', 'WORKSHOP-BILLING-FETCH');
  }

  return payload.data as WorkshopBillingDetails;
}
