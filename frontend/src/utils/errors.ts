/**
 * Shared error extraction for failed HTTP requests.
 *
 * Every hook used to duplicate the same axios-error parsing logic; this
 * centralizes it. Prefers the JSON `{error}` body returned by the backend
 * controllers, then axios's own message, then a sensible default.
 *
 * For non-axios errors (e.g. a thrown `Error` in tests) the default message
 * is returned, matching the historical behaviour of the data hooks which
 * surfaced a stable, localized message rather than the raw exception text.
 * Pass `useMessage=true` to fall back to `err.message` instead (legacy
 * behaviour of useEquity).
 */
import axios, { AxiosError } from 'axios';

export function extractErrorMessage(
  err: unknown,
  defaultMessage: string,
  useMessage = false,
): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    const body = axiosErr.response?.data as { error?: string } | undefined;
    if (body?.error) return body.error;
    if (axiosErr.response?.statusText) return axiosErr.response.statusText;
    if (axiosErr.message) return 'Impossible de contacter le serveur';
  }
  if (useMessage && err instanceof Error && err.message) return err.message;
  return defaultMessage;
}
