/**
 * Wait for all microtasks to complete.
 * This is a test utility to flush the microtask queue before making assertions.
 */
export function waitForMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
