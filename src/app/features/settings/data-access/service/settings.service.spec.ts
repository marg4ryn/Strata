import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LoggerService } from '@app/core/logging/logger/logger.service';
import { SettingsService } from './settings.service';
import { SettingsStoreService } from '../settings-store/settings-store.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let store: {
    showPanel: ReturnType<typeof signal<boolean>>;
  };

  let logger: {
    debug: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      showPanel: signal(false),
    };

    logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SettingsStoreService, useValue: store },
        { provide: LoggerService, useValue: logger },
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
