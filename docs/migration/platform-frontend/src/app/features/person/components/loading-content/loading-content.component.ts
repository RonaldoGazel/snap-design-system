import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'app-loading-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonModule, ProgressBarModule],
  templateUrl: './loading-content.component.html',
  styleUrl: './loading-content.component.scss',
})
export class LoadingContentComponent {
  mode = input<'skeleton' | 'progress'>('skeleton');
}
