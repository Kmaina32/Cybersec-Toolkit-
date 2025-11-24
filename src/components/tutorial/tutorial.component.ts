import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TutorialService } from '../../services/tutorial.service';

@Component({
  selector: 'app-tutorial',
  standalone: true,
  templateUrl: './tutorial.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TutorialComponent {
  tutorialService = inject(TutorialService);
}
