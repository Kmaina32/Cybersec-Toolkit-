import { Injectable, signal } from '@angular/core';

export interface ToolUsage {
  [toolName: string]: number;
}

const ANALYTICS_STORAGE_KEY = 'cyberkit_analytics';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  toolUsage = signal<ToolUsage>({});

  constructor() {
    this.loadFromStorage();
  }

  trackToolUsage(toolName: string) {
    this.toolUsage.update(currentUsage => {
      const newUsage = { ...currentUsage };
      newUsage[toolName] = (newUsage[toolName] || 0) + 1;
      this.saveToStorage(newUsage);
      return newUsage;
    });
  }

  private loadFromStorage() {
    try {
      const storedData = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (storedData) {
        this.toolUsage.set(JSON.parse(storedData));
      }
    } catch (e) {
      console.error('Failed to load analytics data from localStorage', e);
    }
  }

  private saveToStorage(data: ToolUsage) {
    try {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save analytics data to localStorage', e);
    }
  }
}
