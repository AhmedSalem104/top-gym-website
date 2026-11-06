export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}
export async function challengeApi<T>(
  path: string,
  body?: unknown,
  extra: Record<string, string> = {},
): Promise<T> {
  const response = await fetch('/api/challenge/v1/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...extra },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw new ApiError(data.code || 'unavailable', response.status);
  return data as T;
}
