import { beforeAll } from 'vitest';
import { ngMocks } from 'ng-mocks';
import ResizeObserverPolyfill from 'resize-observer-polyfill';
import 'vitest-canvas-mock';

globalThis.ResizeObserver = ResizeObserverPolyfill as unknown as typeof ResizeObserver;

ngMocks.autoSpy('vitest');

beforeAll(() => {
  ngMocks.faster();
});
