import { vi } from 'vitest';

// Polyfill ResizeObserver for JSDOM
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Polyfill PointerEvents and capture methods for Radix UI in JSDOM
if (!window.PointerEvent) {
  // @ts-expect-error Mock PointerEvent
  window.PointerEvent = window.MouseEvent;
}
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
window.HTMLElement.prototype.setPointerCapture = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
