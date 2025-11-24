import { Injectable, signal } from '@angular/core';

export interface TutorialStep {
  title: string;
  content: string;
}

export interface Tutorial {
  title: string;
  steps: TutorialStep[];
}

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  isShowing = signal(false);
  tutorial = signal<Tutorial | null>(null);

  show(tutorial: Tutorial) {
    this.tutorial.set(tutorial);
    this.isShowing.set(true);
  }

  hide() {
    this.isShowing.set(false);
    this.tutorial.set(null);
  }
}
