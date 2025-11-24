import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

interface HoneypotLog {
  timestamp: string;
  ip: string;
  activity: string;
}

@Component({
  selector: 'app-deception-technology',
  standalone: true,
  imports: [],
  templateUrl: './deception-technology.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeceptionTechnologyComponent {
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);

  explanation = signal('');
  isFetchingExplanation = signal(false);
  
  isHoneypotActive = signal(false);
  honeypotLog = signal<HoneypotLog[]>([]);
  private logInterval: any;

  private mockAttackers = [
    { ip: '198.51.100.12', activities: ['Port scan on port 22 (SSH)', 'Attempted login with user: root', 'Failed login attempt'] },
    { ip: '203.0.113.88', activities: ['Port scan on port 80 (HTTP)', 'Sent GET /admin.php request', 'Received 404 Not Found'] },
    { ip: '192.0.2.240', activities: ['Connection to port 445 (SMB)', 'Attempted to access share: "public"', 'Connection closed'] },
    { ip: '203.0.113.45', activities: ['Port scan on port 3389 (RDP)', 'Failed RDP handshake'] },
  ];

  toggleHoneypot() {
    const becomingActive = !this.isHoneypotActive();
    this.isHoneypotActive.set(becomingActive);

    if (becomingActive) {
      this.analyticsService.trackToolUsage('Deception Tech');
      this.activityService.log('Deception Tech', 'Honeypot deployed.');
      this.honeypotLog.set([{ timestamp: this.getTimestamp(), ip: 'SYSTEM', activity: 'Honeypot services started. Awaiting connections...' }]);
      this.startLogging();
    } else {
      this.activityService.log('Deception Tech', 'Honeypot deactivated.');
      this.honeypotLog.update(log => [...log, { timestamp: this.getTimestamp(), ip: 'SYSTEM', activity: 'Honeypot services stopped.' }]);
      this.stopLogging();
    }
  }

  private startLogging() {
    this.logInterval = setInterval(() => {
      const attacker = this.mockAttackers[Math.floor(Math.random() * this.mockAttackers.length)];
      const activity = attacker.activities[Math.floor(Math.random() * attacker.activities.length)];
      
      const newLog: HoneypotLog = {
        timestamp: this.getTimestamp(),
        ip: attacker.ip,
        activity: activity,
      };

      this.honeypotLog.update(log => [newLog, ...log.slice(0, 19)]);
    }, 4000); // Add a log entry every 4 seconds
  }

  private stopLogging() {
    if (this.logInterval) {
      clearInterval(this.logInterval);
    }
  }

  private getTimestamp(): string {
      return new Date().toLocaleTimeString();
  }

  ngOnDestroy() {
    this.stopLogging();
  }

  getExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation('Deception Technology')
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'Deception Technology Tutorial',
      steps: [
        {
          title: 'Step 1: What is a Honeypot?',
          content: "A honeypot is a decoy system designed to attract and trap attackers. It looks like a real, vulnerable system, allowing security teams to study attackers' methods without risking real assets."
        },
        {
          title: 'Step 2: Deploy the Honeypot',
          content: "Click the 'Deploy Honeypot' button. This will activate a simulated decoy server that appears to be on the internet, waiting for attackers to interact with it."
        },
        {
          title: 'Step 3: Monitor the Activity Log',
          content: "Once active, the log will begin showing simulated traffic from automated bots and curious attackers. You'll see things like port scans and failed login attempts, giving you insight into the kinds of attacks that happen constantly on the web."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
