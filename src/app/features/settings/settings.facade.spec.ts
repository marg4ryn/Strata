import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { SettingsFacade } from './settings.facade';
import { SettingsStoreService } from './data-access/settings-store/settings-store.service';
import { SettingsService } from './data-access/settings/settings.service';

describe('SettingsFacade', () => {
  let service: SettingsFacade;
  let store: {
    showPanel: ReturnType<typeof signal<boolean>>;
  };

  let settingsService: {
    openPanel: ReturnType<typeof vi.fn>;
    closePanel: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    store = {
      showPanel: signal(false),
    };

    settingsService = {
      openPanel: vi.fn(),
      closePanel: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SettingsService, useValue: settingsService },
        { provide: SettingsStoreService, useValue: store },
      ],
    });
    service = TestBed.inject(SettingsFacade);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates computed signals', () => {
    store.showPanel.set(true);
    expect(service.showPanel()).toBeTruthy();
  });

  it('handles openPanel', () => {
    service.openPanel();
    expect(settingsService.openPanel).toHaveBeenCalledOnce();
  });

  it('handles closePanel', () => {
    service.closePanel();
    expect(settingsService.closePanel).toHaveBeenCalledOnce();
  });
});
