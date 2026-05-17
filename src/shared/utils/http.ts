export async function readJsonSafely(response: Response): Promise<any> {
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

export class AppHttpError extends Error {
  readonly code: string;
  readonly status: number;
  readonly userMessage: string;
  readonly technicalMessage: string;

  constructor(params: {
    code: string;
    status: number;
    userMessage: string;
    technicalMessage: string;
  }) {
    super(params.userMessage);
    this.name = 'AppHttpError';
    this.code = params.code;
    this.status = params.status;
    this.userMessage = params.userMessage;
    this.technicalMessage = params.technicalMessage;
  }
}

export async function buildHttpError(
  response: Response,
  fallbackUserMessage: string,
  code: string,
): Promise<AppHttpError> {
  const payload = await readJsonSafely(response);
  const technicalMessage = String(
    payload?.message || payload?.error || response.statusText || `HTTP ${response.status}`,
  );

  return new AppHttpError({
    code,
    status: response.status,
    userMessage: fallbackUserMessage,
    technicalMessage,
  });
}

export function getUserFacingErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AppHttpError) {
    return `${error.userMessage} [${error.code}]`;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}
