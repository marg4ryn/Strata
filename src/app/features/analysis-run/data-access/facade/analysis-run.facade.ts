import { inject, Service, computed } from '@angular/core';
import { StoreService } from '../store/store.service';

@Service()
export class AnalysisRunFacade {
  private readonly store = inject(StoreService);

  showModal = computed(() => this.store.showModal());
  isBusy = computed(() => this.store.isBusy());
  progress = computed(() => this.store.progress());
  analysisId = computed(() => this.store.result());
  error = computed(() => this.store.error());
}
