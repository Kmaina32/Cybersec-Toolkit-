import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

interface PhoneInfo {
  number: string;
  country: string;
  carrier: string;
  lineType: string;
  reputation: {
    score: number;
    provider: string;
  };
  socials: string[];
}

@Component({
  selector: 'app-phone-infoga',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './phone-infoga.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneInfogaComponent {
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);

  phoneNumber = signal('+1-555-010-8765');
  isScanning = signal(false);
  scanResult = signal<PhoneInfo | null>(null);
  scanLog = signal<string[]>([]);
  scanComplete = signal(false);
  error = signal<string | null>(null);

  explanation = signal('');
  isFetchingExplanation = signal(false);

  async scan() {
    if (this.isScanning() || !this.phoneNumber()) return;
    
    this.analyticsService.trackToolUsage('Phone OSINT');
    this.isScanning.set(true);
    this.scanResult.set(null);
    this.scanLog.set([]);
    this.scanComplete.set(false);
    this.error.set(null);
    
    const targetNumber = this.phoneNumber();
    this.activityService.log('Phone OSINT', `Scan initiated for ${targetNumber}`);

    // Simple validation for demo
    if (!/^\+?[1-9]\d{1,14}$/.test(targetNumber.replace(/[\s-]/g, ''))) {
      this.error.set('Invalid phone number format. Please use international format (e.g., +15550108765).');
      this.isScanning.set(false);
      return;
    }

    await this.logWithDelay(`[+] Initiating scan for ${targetNumber}...`, 500);
    await this.logWithDelay('[+] Checking number validity and format...', 700);
    await this.logWithDelay('[*] Number is valid.', 300);
    await this.logWithDelay('[+] Querying carrier information...', 1000);

    const isMockNumber = targetNumber.includes('555-010-8765');
    const resultData: PhoneInfo = isMockNumber 
    ? {
        number: '+1-555-010-8765',
        country: 'United States',
        carrier: 'Verizon Wireless',
        lineType: 'Mobile (VoIP)',
        reputation: { score: 85, provider: 'Nomorobo' },
        socials: ['Facebook', 'LinkedIn', 'Whatsapp'],
      }
    : {
        number: targetNumber,
        country: 'Unknown',
        carrier: 'Unknown',
        lineType: 'Unknown',
        reputation: { score: 0, provider: 'Unknown' },
        socials: [],
      };
      
    await this.logWithDelay(`[*] Carrier identified: ${resultData.carrier} (${resultData.country})`, 500);
    await this.logWithDelay(`[*] Line type: ${resultData.lineType}`, 300);
    await this.logWithDelay('[+] Scanning public data breach repositories...', 1500);
    await this.logWithDelay('[*] No direct matches found in known breaches.', 1000);
    await this.logWithDelay('[+] Scanning social media footprints...', 1200);
    
    if (isMockNumber) {
        for (const social of resultData.socials) {
            await this.logWithDelay(`[*] Found profile on: ${social}`, 400);
        }
    } else {
        await this.logWithDelay('[*] No public social profiles found.', 800);
    }
    
    await this.logWithDelay('[+] Aggregating reputation data...', 1000);
    await this.logWithDelay(`[*] Reputation score: ${resultData.reputation.score}/100 (Low risk)`, 500);
    await this.logWithDelay('[+] Scan complete.', 500);

    this.scanResult.set(resultData);
    this.isScanning.set(false);
    this.scanComplete.set(true);
    this.activityService.log('Phone OSINT', `Scan finished for ${targetNumber}.`);
  }

  private async logWithDelay(message: string, delay: number) {
    this.scanLog.update(log => [...log, message]);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  getExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation('Phone Number OSINT')
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'Phone OSINT Tutorial',
      steps: [
        {
          title: 'Step 1: Understand OSINT',
          content: "Open-Source Intelligence (OSINT) is the practice of collecting information from publicly available sources. This tool simulates gathering data linked to a phone number."
        },
        {
          title: 'Step 2: Enter a Phone Number',
          content: "Input a phone number in the search box. For this simulation, use the pre-filled number to see a full set of example results."
        },
        {
          title: 'Step 3: Analyze the Report',
          content: "Click 'Scan'. The tool will generate a report showing the kind of information that can be found, such as the carrier, line type, and associated social media profiles. In a real scenario, this data is aggregated from many public sources."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
