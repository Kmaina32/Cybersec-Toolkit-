import { Injectable, signal } from '@angular/core';

export interface Activity {
  tool: string;
  message: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class ActivityService {
  activities = signal<Activity[]>([]);

  log(tool: string, message: string) {
    const newActivity: Activity = {
      tool,
      message,
      timestamp: new Date(),
    };
    // Keep the log to a reasonable size
    this.activities.update(activities => [newActivity, ...activities.slice(0, 19)]);
  }
}
