import 'vitest-canvas-mock';
import ResizeObserverPolyfill from 'resize-observer-polyfill';

globalThis.ResizeObserver = ResizeObserverPolyfill as unknown as typeof ResizeObserver;
