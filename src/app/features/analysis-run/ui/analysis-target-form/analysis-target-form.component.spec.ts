import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AnalysisTargetForm } from './analysis-target-form.component';

describe('AnalysisTargetForm', () => {
  let fixture: ComponentFixture<AnalysisTargetForm>;
  let component: AnalysisTargetForm;

  beforeEach(async () => {
    vi.useFakeTimers();

    await TestBed.configureTestingModule({
      imports: [AnalysisTargetForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisTargetForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function getUrlInput(): HTMLInputElement {
    return fixture.debugElement.query(By.css('#analysisTargetURL')).nativeElement;
  }

  function getCheckbox(): HTMLInputElement {
    return fixture.debugElement.query(By.css('input[type="checkbox"]')).nativeElement;
  }

  function getDateInputs(): HTMLInputElement[] {
    return fixture.debugElement
      .queryAll(By.css('input[type="date"]'))
      .map((de) => de.nativeElement);
  }

  function setInputValue(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function submitForm(): void {
    fixture.debugElement.query(By.css('form')).triggerEventHandler('submit', {
      preventDefault: () => {},
    });
    fixture.detectChanges();
  }

  async function advance(ms: number): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
  }

  // ---------------------------------------------------------------------
  // URL field validation
  // ---------------------------------------------------------------------
  describe('URL validation', () => {
    it('should be invalid and required when empty', async () => {
      const input = getUrlInput();
      setInputValue(input, '');
      await advance(300);

      expect(component.analysisTargetForm.targetURL().invalid()).toBe(true);
      const messages = component.analysisTargetForm
        .targetURL()
        .errors()
        .map((e: any) => e.message);
      expect(messages).toContain('URL is required');
    });

    it('should be invalid for a malformed URL', async () => {
      const input = getUrlInput();
      setInputValue(input, 'not-a-valid-url');
      await advance(300);

      expect(component.analysisTargetForm.targetURL().invalid()).toBe(true);
      const messages = component.analysisTargetForm
        .targetURL()
        .errors()
        .map((e: any) => e.message);
      expect(messages).toContain('Enter a valid URL');
    });

    it('should be valid for a well-formed URL', async () => {
      const input = getUrlInput();
      setInputValue(input, 'https://github.com/JohnDoe/Project.git');
      await advance(300);

      expect(component.analysisTargetForm.targetURL().invalid()).toBe(false);
    });

    it('should be invalid when exceeding max length of 500 characters', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(500);
      const input = getUrlInput();
      setInputValue(input, longUrl);
      await advance(300);

      expect(component.analysisTargetForm.targetURL().invalid()).toBe(true);
    });

    it('should debounce validation by 300ms', async () => {
      const input = getUrlInput();
      input.value = 'not-valid';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const hasUrlError = () =>
        component.analysisTargetForm
          .targetURL()
          .errors()
          .some((e: any) => e.kind === 'url');

      await advance(100);
      // Debounce window (300ms) hasn't elapsed yet - the new value shouldn't
      // have been validated as an invalid URL.
      expect(hasUrlError()).toBe(false);

      await advance(250); // total 350ms > 300ms debounce
      expect(hasUrlError()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------
  // limitRange / date visibility & requiredness
  // ---------------------------------------------------------------------
  describe('limitRange toggle', () => {
    it('should hide and not require date fields when unchecked', () => {
      expect(component.analysisTargetForm.limitRange().value()).toBe(false);
      expect(component.analysisTargetForm.startDate().hidden()).toBe(true);
      expect(component.analysisTargetForm.endDate().hidden()).toBe(true);
      expect(getDateInputs().length).toBe(0);
    });

    it('should show and require date fields when checked', () => {
      const checkbox = getCheckbox();
      checkbox.click();
      fixture.detectChanges();

      expect(component.analysisTargetForm.limitRange().value()).toBe(true);
      expect(component.analysisTargetForm.startDate().hidden()).toBe(false);
      expect(component.analysisTargetForm.endDate().hidden()).toBe(false);
      expect(getDateInputs().length).toBe(2);

      submitForm();
      expect(component.analysisTargetForm.startDate().invalid()).toBe(true);
      expect(component.analysisTargetForm.endDate().invalid()).toBe(true);
    });

    it('should stop requiring dates again after unchecking', () => {
      const checkbox = getCheckbox();
      checkbox.click();
      fixture.detectChanges();
      checkbox.click();
      fixture.detectChanges();

      expect(component.analysisTargetForm.startDate().hidden()).toBe(true);
      submitForm();
      expect(component.analysisTargetForm.targetURL().invalid()).toBe(true); // still empty
      expect(getDateInputs().length).toBe(0);
    });
  });

  // ---------------------------------------------------------------------
  // Date range validation
  // ---------------------------------------------------------------------
  describe('date range validation', () => {
    beforeEach(() => {
      getCheckbox().click();
      fixture.detectChanges();
    });

    it('should reject start date before 1970-01-01', () => {
      const [startInput] = getDateInputs();
      setInputValue(startInput, '1960-01-01');

      expect(component.analysisTargetForm.startDate().invalid()).toBe(true);
      const messages = component.analysisTargetForm
        .startDate()
        .errors()
        .map((e: any) => e.message);
      expect(messages.some((m: string) => m.includes('cannot be earlier than'))).toBe(true);
    });

    it('should reject end date before 1970-01-01', () => {
      const [, endInput] = getDateInputs();
      setInputValue(endInput, '1960-01-01');

      expect(component.analysisTargetForm.endDate().invalid()).toBe(true);
    });

    it('should reject a start date in the future', () => {
      const [startInput] = getDateInputs();
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      setInputValue(startInput, future.toISOString().slice(0, 10));

      expect(component.analysisTargetForm.startDate().invalid()).toBe(true);
      const messages = component.analysisTargetForm
        .startDate()
        .errors()
        .map((e: any) => e.message);
      expect(messages).toContain('Start date cannot be in the future');
    });

    it('should reject an end date in the future', () => {
      const [, endInput] = getDateInputs();
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      setInputValue(endInput, future.toISOString().slice(0, 10));

      expect(component.analysisTargetForm.endDate().invalid()).toBe(true);
      const messages = component.analysisTargetForm
        .endDate()
        .errors()
        .map((e: any) => e.message);
      expect(messages).toContain('End date cannot be in the future');
    });

    it('should reject end date earlier than start date', () => {
      const [startInput, endInput] = getDateInputs();
      setInputValue(startInput, '2024-06-15');
      setInputValue(endInput, '2024-01-01');

      expect(component.analysisTargetForm.endDate().invalid()).toBe(true);
      const messages = component.analysisTargetForm
        .endDate()
        .errors()
        .map((e: any) => e.message);
      expect(messages).toContain('End date must be after start date');
    });

    it('should accept a valid date range', () => {
      const [startInput, endInput] = getDateInputs();
      setInputValue(startInput, '2024-01-01');
      setInputValue(endInput, '2024-06-15');

      expect(component.analysisTargetForm.startDate().invalid()).toBe(false);
      expect(component.analysisTargetForm.endDate().invalid()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------
  // Submission behavior
  // ---------------------------------------------------------------------
  describe('form submission', () => {
    it('should focus the first invalid control and not submit when form is invalid', () => {
      submitForm();
      fixture.detectChanges();

      expect(component.analysisTargetForm.targetURL().invalid()).toBe(true);
      expect(document.activeElement).toBe(getUrlInput());
    });

    it('should disable the submit button while submitting', async () => {
      const input = getUrlInput();
      setInputValue(input, 'https://github.com/JohnDoe/Project.git');
      await advance(300);

      const button: HTMLButtonElement = fixture.debugElement.query(
        By.css('button[type="submit"]'),
      ).nativeElement;

      submitForm();
      fixture.detectChanges();
      expect(button.disabled).toBe(true);
      expect(button.textContent).toContain('Loading');

      await advance(0);
      expect(button.disabled).toBe(false);
      expect(button.textContent).toContain('Start Analysis');
    });
  });

  // ---------------------------------------------------------------------
  // isInvalid() helper & error rendering
  // ---------------------------------------------------------------------
  describe('isInvalid helper', () => {
    it('should return false when field is untouched, even if invalid', () => {
      expect(component.isInvalid(component.analysisTargetForm.targetURL)).toBe(false);
    });

    it('should return true only after the field has been touched and is invalid', async () => {
      const input = getUrlInput();
      setInputValue(input, '');
      await advance(300);

      expect(component.isInvalid(component.analysisTargetForm.targetURL)).toBe(true);
    });

    it('should add the "invalid" class to the URL input when isInvalid is true', async () => {
      const input = getUrlInput();
      setInputValue(input, '');
      await advance(300);

      expect(input.classList.contains('invalid')).toBe(true);
    });

    it('should render an error-list item for each URL error', async () => {
      const input = getUrlInput();
      setInputValue(input, '');
      await advance(300);

      const items = fixture.debugElement.queryAll(By.css('.error-list li'));
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].nativeElement.textContent).toContain('URL is required');
    });
  });
});
