import { request } from '@/shared/api';

export async function deleteAnalysisRun(id: string): Promise<void> {
  await request(`/analyses/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
