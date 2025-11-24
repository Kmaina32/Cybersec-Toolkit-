import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

interface InstagramProfile {
  username: string;
  fullName: string;
  avatarUrl: string;
  isPrivate: boolean;
  bio: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  posts: { imageUrl: string }[];
}

@Component({
  selector: 'app-insta-osint',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './insta-osint.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstaOsintComponent {
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);

  username = signal('travel_enthusiast');
  isLoading = signal(false);
  profile = signal<InstagramProfile | null>(null);
  error = signal<string | null>(null);

  explanation = signal('');
  isFetchingExplanation = signal(false);

  async search() {
    if (!this.username()) return;

    this.analyticsService.trackToolUsage('Instagram OSINT');
    this.isLoading.set(true);
    this.profile.set(null);
    this.error.set(null);
    this.activityService.log('Instagram OSINT', `Search started for @${this.username()}`);

    await new Promise(resolve => setTimeout(resolve, 2000));

    if (this.username().toLowerCase() === 'travel_enthusiast') {
      this.profile.set({
        username: 'travel_enthusiast',
        fullName: 'Alex Wanderlust',
        avatarUrl: `https://picsum.photos/seed/${this.username()}/150/150`,
        isPrivate: false,
        bio: 'Exploring the world one city at a time 🌍✈️ | Coffee lover ☕ | Photographer 📸',
        postCount: 188,
        followerCount: 5432,
        followingCount: 450,
        posts: Array.from({ length: 12 }, (_, i) => ({
          imageUrl: `https://picsum.photos/seed/${this.username()}_post${i}/500/500`,
        })),
      });
    } else {
       this.profile.set({
        username: this.username(),
        fullName: 'User Not Found',
        avatarUrl: `https://picsum.photos/seed/notfound/150/150`,
        isPrivate: true,
        bio: 'This account is private or does not exist.',
        postCount: 0,
        followerCount: 0,
        followingCount: 0,
        posts: [],
      });
    }

    this.isLoading.set(false);
  }

  getExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation('Social Media OSINT (Instagram)')
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'Instagram OSINT Tutorial',
      steps: [
        {
          title: 'Step 1: The Target',
          content: "Enter the username of an Instagram profile you want to investigate. This tool simulates what an investigator could see on a public profile."
        },
        {
          title: 'Step 2: Start the Search',
          content: "Click 'Search' to begin the simulated scrape. For this demo, use the default username 'travel_enthusiast' to see a full profile."
        },
        {
          title: 'Step 3: Analyze the Profile',
          content: "Review the scraped data. The bio, post count, and follower numbers can provide initial insights. The grid of recent posts is especially valuable, as photos can reveal locations, associates, and habits."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
