const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
    cache: options?.cache || 'no-store',
  });

  if (!response.ok) {
    let errorData: unknown;
    let message = `API request failed with status ${response.status}`;
    try {
      const errorText = await response.text();
      if (errorText) {
        errorData = JSON.parse(errorText);
        if (typeof errorData === 'object' && errorData !== null && 'message' in errorData) {
          message = String((errorData as { message: string }).message);
        }
      }
    } catch {
      // not JSON
    }
    throw new ApiError(message, response.status, errorData);
  }

  // Nếu HTTP 204 No Content hoặc phản hồi rỗng, không gọi response.json() để tránh lỗi "Unexpected end of JSON input"
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text || text.trim() === '') {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}
