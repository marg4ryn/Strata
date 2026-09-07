import { EnvironmentInjector, runInInjectionContext, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { pageResource } from './page-resource';

describe('pageResource', () => {
  it('reloads when the parameter changes', async () => {
    const injector = TestBed.inject(EnvironmentInjector);
    const calls: string[] = [];
    const param = signal<string>('0');

    runInInjectionContext(injector, () =>
      pageResource(async () => {
        calls.push(param());
        return param();
      }, param),
    );

    await vi.waitFor(() => expect(calls).toEqual(['0']));

    param.set('1');

    await vi.waitFor(() => expect(calls).toEqual(['0', '1']));
  });
});
