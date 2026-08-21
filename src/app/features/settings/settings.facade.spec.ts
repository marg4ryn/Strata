import { TestBed } from '@angular/core/testing';

import { SettingsFacade } from './settings.facade';

describe('SettingsFacade', () => {
  let service: SettingsFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsFacade);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
