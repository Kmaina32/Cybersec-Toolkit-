import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [],
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsComponent {
  analyticsService = inject(AnalyticsService);

  chartData = computed(() => {
    const usage = this.analyticsService.toolUsage();
    // FIX: The value from Object.entries can be 'unknown'. Map to ensure 'count' is a number
    // for all subsequent calculations, resolving multiple downstream type errors.
    const entries: [string, number][] = Object.entries(usage).map(([name, count]) => [name, Number(count)]);
    
    const totalUsage = entries.reduce((sum, [, count]) => sum + count, 0);

    if (totalUsage === 0) {
      return [];
    }

    return entries
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / totalUsage) * 100,
      }))
      .sort((a, b) => b.count - a.count); // Sort descending
  });

  totalEvents = computed(() => {
     return this.chartData().reduce((sum, item) => sum + item.count, 0);
  });
}
