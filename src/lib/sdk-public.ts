import { ApiClient } from '@walter22175/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const sdkPublic = new ApiClient({ baseUrl });

interface ApiEnvelope<T> {
  statusCode: number;
  timestamp: string;
  data: T;
}

function unwrap<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'data' in raw && 'timestamp' in raw) {
    return (raw as ApiEnvelope<T>).data;
  }
  return raw as T;
}

export async function getPublic<T>(
  path: string,
  extraHeaders?: Record<string, string>,
): Promise<T> {
  const raw = await sdkPublic.get<unknown>(path, extraHeaders);
  return unwrap<T>(raw);
}
