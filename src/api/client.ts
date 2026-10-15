export const API_BASE = 'https://openlibrary.org';
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
export async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  try {
    const response = await fetch(url, { signal });
    if (!response.ok)
      throw new ApiError(
        response.status,
        response.status === 404
          ? 'Книга не найдена.'
          : response.status >= 500
            ? 'Сервис временно недоступен. Попробуйте ещё раз.'
            : `Запрос отклонён (${response.status}).`,
      );
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      0,
      typeof navigator !== 'undefined' && !navigator.onLine ? 'Нет подключения к сети.' : 'Не удалось связаться с библиотекой. Проверьте подключение.',
    );
  }
}
