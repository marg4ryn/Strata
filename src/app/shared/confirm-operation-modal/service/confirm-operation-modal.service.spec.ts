import { TestBed } from '@angular/core/testing';
import { DestroyRef } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { Subscription, Subject } from 'rxjs';

import { ConfirmOperationModalService } from './confirm-operation-modal.service';

describe('ConfirmOperationModalService', () => {
  let service: ConfirmOperationModalService;
  let cancel$: Subject<void>;
  let confirm$: Subject<void>;
  let backdropClick$: Subject<void>;
  let keydownEvents$: Subject<KeyboardEvent>;
  let detachments$: Subject<void>;
  let overlayRefMock: any;
  let componentRefMock: any;
  let overlayMock: any;

  beforeEach(() => {
    cancel$ = new Subject();
    confirm$ = new Subject();
    backdropClick$ = new Subject();
    keydownEvents$ = new Subject();
    detachments$ = new Subject();

    componentRefMock = {
      setInput: vi.fn(),
      changeDetectorRef: { detectChanges: vi.fn() },
      instance: { cancel: cancel$, confirm: confirm$ },
    };

    overlayRefMock = {
      attach: vi.fn(() => componentRefMock),
      dispose: vi.fn(),
      backdropClick: vi.fn(() => backdropClick$),
      keydownEvents: vi.fn(() => keydownEvents$),
      detachments: vi.fn(() => detachments$),
    };

    overlayMock = {
      create: vi.fn(() => overlayRefMock),
      position: vi.fn(() => ({
        global: vi.fn().mockReturnThis(),
        centerHorizontally: vi.fn().mockReturnThis(),
        centerVertically: vi.fn().mockReturnThis(),
      })),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Overlay, useValue: overlayMock }],
    });
    service = TestBed.inject(ConfirmOperationModalService);
  });

  const fakeDestroyRef = () => {
    let cb: (() => void) | undefined;
    return {
      onDestroy: vi.fn((fn: () => void) => (cb = fn)),
      trigger: () => cb?.(),
    } as unknown as DestroyRef & { trigger: () => void };
  };

  it('resolves true and disposes overlay on confirm', async () => {
    const promise = service.confirm(fakeDestroyRef());
    confirm$.next();
    await expect(promise).resolves.toBe(true);
    expect(overlayRefMock.dispose).toHaveBeenCalled();
  });

  it('resolves false on cancel', async () => {
    const promise = service.confirm(fakeDestroyRef());
    cancel$.next();
    await expect(promise).resolves.toBe(false);
  });

  it('resolves false on backdrop click', async () => {
    const promise = service.confirm(fakeDestroyRef());
    backdropClick$.next();
    await expect(promise).resolves.toBe(false);
  });

  it('resolves false on Escape keydown, ignores other keys', async () => {
    const promise = service.confirm(fakeDestroyRef());
    keydownEvents$.next({ key: 'Enter' } as KeyboardEvent);
    keydownEvents$.next({ key: 'Escape' } as KeyboardEvent);
    await expect(promise).resolves.toBe(false);
  });

  it('resolves false when destroyRef triggers onDestroy', async () => {
    const destroyRef = fakeDestroyRef();
    const promise = service.confirm(destroyRef);
    destroyRef.trigger();
    await expect(promise).resolves.toBe(false);
  });

  it('sets inputs when provided', () => {
    const params = { param: 'param' };
    service.confirm(fakeDestroyRef(), 'myLabelKey', 'danger', params);
    expect(componentRefMock.setInput).toHaveBeenCalledWith('labelKey', 'myLabelKey');
    expect(componentRefMock.setInput).toHaveBeenCalledWith('type', 'danger');
    expect(componentRefMock.setInput).toHaveBeenCalledWith(
      'params',
      expect.objectContaining(params),
    );
  });

  it('does not set inputs when they are absent', () => {
    service.confirm(fakeDestroyRef());
    expect(componentRefMock.setInput).not.toHaveBeenCalled();
  });

  it('unsubscribes cancel/confirm on detachment', () => {
    const unsubSpy = vi.spyOn(Subscription.prototype, 'unsubscribe');
    service.confirm(fakeDestroyRef());
    const callsBefore = unsubSpy.mock.calls.length;
    detachments$.next();
    expect(unsubSpy.mock.calls.length).toBeGreaterThanOrEqual(callsBefore + 2);
    unsubSpy.mockRestore();
  });

  it('refocuses previously active element after cleanup', async () => {
    const btn = document.createElement('button');
    document.body.appendChild(btn);
    btn.focus();
    const focusSpy = vi.spyOn(btn, 'focus');

    const promise = service.confirm(fakeDestroyRef());
    confirm$.next();
    await promise;

    expect(focusSpy).toHaveBeenCalled();
    btn.remove();
  });
});
