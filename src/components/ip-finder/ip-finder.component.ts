import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ActivityService } from '../../services/activity.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-ip-finder',
  standalone: true,
  imports: [],
  templateUrl: './ip-finder.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpFinderComponent {
  private http = inject(HttpClient);
  private activityService = inject(ActivityService);
  private analyticsService = inject(AnalyticsService);
  
  ipInfo = signal<any | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  copyButtonText = signal('Copy');

  constructor() {
    this.fetchIpInfo();
  }

  fetchIpInfo() {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get('https://ipapi.co/json/').pipe(
      catchError(err => {
        console.error('IP Geolocation error:', err);
        const errorMessage = err.status === 0 
          ? 'Could not connect. This might be due to a network error or an ad-blocker.'
          : `Failed to fetch IP data. Status: ${err.status}`;
        this.error.set(errorMessage);
        return of(null);
      })
    ).subscribe(data => {
      this.isLoading.set(false);
      if (data) {
        this.ipInfo.set(data);
        this.activityService.log('My IP Address', `Found IP: ${data.ip}`);
        this.analyticsService.trackToolUsage('My IP Address');
      }
    });
  }
  
  copyIp() {
    const ip = this.ipInfo()?.ip;
    if (ip) {
      navigator.clipboard.writeText(ip).then(() => {
        this.copyButtonText.set('Copied!');
        setTimeout(() => this.copyButtonText.set('Copy'), 2000);
      });
    }
  }
}
