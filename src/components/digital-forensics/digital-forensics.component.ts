import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-digital-forensics',
  standalone: true,
  imports: [],
  templateUrl: './digital-forensics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DigitalForensicsComponent {
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);

  explanation = signal('');
  isFetchingExplanation = signal(false);
  isAnalyzing = signal(false);
  analysisLog = signal<string[]>([]);
  analysisComplete = signal(false);

  async startAnalysis() {
    this.analyticsService.trackToolUsage('Forensics Tools');
    this.isAnalyzing.set(true);
    this.analysisComplete.set(false);
    this.analysisLog.set(['[+] Starting analysis of disk image...']);
    this.activityService.log('Forensics Tools', 'Started disk image analysis.');

    await this.logWithDelay('[+] Mounting disk image: system_drive.dd', 1000);
    await this.logWithDelay('[+] Filesystem identified: NTFS', 500);
    await this.logWithDelay('[+] Searching for deleted files...', 2000);
    await this.logWithDelay('[+] Found 3 deleted files in unallocated space.', 1500);
    await this.logWithDelay('[*] Recovered file: C:\\Users\\user\\Documents\\secret_plans.docx', 500);
    await this.logWithDelay('[*] Recovered file: C:\\Users\\user\\Downloads\\malware.exe', 500);
    await this.logWithDelay('[*] Recovered file: C:\\Windows\\Temp\\log.tmp', 500);
    await this.logWithDelay('[+] Scanning for artifacts in registry hives...', 2000);
    await this.logWithDelay('[!] Found suspicious autorun entry: "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\evil.exe"', 1500);
    await this.logWithDelay('[+] Extracting browser history...', 1000);
    await this.logWithDelay('[!] Found visit to malicious_site.com at 2024-05-20 14:32:10', 1000);
    await this.logWithDelay('[+] Analysis complete. Found 2 critical items of interest.', 500);
    
    this.isAnalyzing.set(false);
    this.analysisComplete.set(true);
    this.activityService.log('Forensics Tools', 'Disk image analysis finished.');
  }

  private async logWithDelay(message: string, delay: number) {
    await new Promise(resolve => setTimeout(resolve, delay));
    this.analysisLog.update(log => [...log, message]);
  }

  getExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation('Digital Forensics Tools')
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'Digital Forensics Tutorial',
      steps: [
        {
          title: 'Step 1: Understand the Scenario',
          content: "Imagine a security breach has occurred. Digital forensics is the process of collecting and analyzing data from digital systems to figure out what happened. This tool simulates analyzing a disk image from a compromised computer."
        },
        {
          title: 'Step 2: Start the Analysis',
          content: "Click the 'Analyze Disk Image' button. This will begin a simulated process of examining a disk image for evidence."
        },
        {
          title: 'Step 3: Observe the Log',
          content: "The log will show the steps a forensics tool might take, such as recovering deleted files, checking the system registry for suspicious entries, and analyzing browser history. These findings provide clues about the attacker's activities."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
