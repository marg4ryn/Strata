import { TestBed } from '@angular/core/testing';
import { runInInjectionContext, EnvironmentInjector } from '@angular/core';

import { injectLogger } from './inject-logger';
import { LoggerService } from '../logger/logger.service';

describe('injectLogger', () => {
  let injector: EnvironmentInjector;
  let withContextSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    withContextSpy = vi.fn().mockReturnValue('context-logger-instance');

    TestBed.configureTestingModule({
      providers: [{ provide: LoggerService, useValue: { withContext: withContextSpy } }],
    });

    injector = TestBed.inject(EnvironmentInjector);
  });

  it('calls LoggerService.withContext with the given context', () => {
    const result = runInInjectionContext(injector, () => injectLogger('StorageService'));
    expect(withContextSpy).toHaveBeenCalledWith('StorageService');
    expect(result).toBe('context-logger-instance');
  });
});
