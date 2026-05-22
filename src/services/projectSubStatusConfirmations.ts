import { apiFetch } from '@/lib/apiClient';


export async function markSubStatusConfirmed(
  projectId: string,
  subStatusName: string,
  note?: string
): Promise<void> {
  await apiFetch('/project-sub-status-confirmations/confirm', {
    method: 'POST',
    body: JSON.stringify({ projectId, subStatusName, note })
  });
}
