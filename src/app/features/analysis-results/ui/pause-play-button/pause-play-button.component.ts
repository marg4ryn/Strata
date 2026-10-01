import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-pause-play-button',
  imports: [TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './pause-play-button.component.scss',
  templateUrl: './pause-play-button.component.html',
})
export class PausePlayButtonComponent {
  play = model<boolean>(false);

  toggle(): void {
    this.play.update((prev) => !prev);
  }
}
