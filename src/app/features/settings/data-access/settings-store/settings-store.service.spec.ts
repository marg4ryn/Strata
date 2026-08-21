import { TestBed } from '@angular/core/testing';

import { SettingsStoreService } from './settings-store.service';

describe('SettingsStoreService', () => {
  let service: SettingsStoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsStoreService);
  });

  it('initially sets showPanel to false', () => {
    expect(service.showPanel()).toBeFalsy();
  });

  it('updates computed signals', () => {
    service.showPanel.set(true);
    expect(service.showPanel()).toBeTruthy();
  });
});
