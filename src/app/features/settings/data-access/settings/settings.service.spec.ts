import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MockService } from 'ng-mocks';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { ContextLogger } from '@app/core/logging/context-logger/context-logger';
import { SettingsService } from './settings.service';
import { SettingsStoreService } from '../settings-store/settings-store.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let logger: ReturnType<typeof MockService<ContextLogger>>;
  let store: { showPanel: ReturnType<typeof signal<boolean>> };

  beforeEach(() => {
    store = {
      showPanel: signal(false),
    };

    logger = MockService(ContextLogger);

    const loggerService = MockService(LoggerService, {
      withContext: () => logger,
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: SettingsStoreService, useValue: store },
        { provide: LoggerService, useValue: loggerService },
      ],
    });

    service = TestBed.inject(SettingsService);
  });

  it('handles openPanel', () => {
    store.showPanel.set(false);
    service.openPanel();
    expect(store.showPanel()).toBeTruthy();
  });

  it('handles closePanel', () => {
    store.showPanel.set(true);
    service.closePanel();
    expect(store.showPanel()).toBeFalsy();
  });
});
