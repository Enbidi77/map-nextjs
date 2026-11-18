/**
 * Debounce utility for autocomplete searches and input events.
 */
export function debounce<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R> | R,
  delayMs: number = 300
): (...args: Args) => Promise<R> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Args): Promise<R> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  };
}
