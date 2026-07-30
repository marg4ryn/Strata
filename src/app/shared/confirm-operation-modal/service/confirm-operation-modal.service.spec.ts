import { TestBed } from '@angular/core/testing';

import { ConfirmOperationModalService } from './confirm-operation-modal.service';

describe('ConfirmOperationModalService', () => {
  let service: ConfirmOperationModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmOperationModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
