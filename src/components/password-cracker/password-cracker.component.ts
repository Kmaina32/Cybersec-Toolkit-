import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

interface CrackResult {
  found: boolean;
  password?: string;
  attempts: number;
  time: number;
  hash: string;
}

@Component({
  selector: 'app-password-cracker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './password-cracker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordCrackerComponent {
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);

  hashInput = signal('8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'); // SHA-256 for "password"
  hashType = signal('SHA-256');
  isCracking = signal(false);
  crackResult = signal<CrackResult | null>(null);
  attemptsLog = signal<string[]>([]);
  progress = signal(0);
  wordlistSource = signal('default');
  customWordlist = signal<string[]>([]);
  customWordlistName = signal('');

  private crackAbortController: AbortController | null = null;
  private dictionary = ['password', '123456', 'qwerty', 'admin', 'root', 'football', 'starwars', 'princess', 'dragon', 'shadow', 'hunter2', '123456789', 'iloveyou', 'secret'];

  async crack() {
    if (this.isCracking() || !this.hashInput()) return;
    
    this.analyticsService.trackToolUsage('Password Cracker');
    this.isCracking.set(true);
    this.crackResult.set(null);
    this.attemptsLog.set([]);
    this.progress.set(0);
    this.crackAbortController = new AbortController();
    const signal = this.crackAbortController.signal;

    const targetHash = this.hashInput().toLowerCase();
    const wordlist = this.wordlistSource() === 'custom' && this.customWordlist().length > 0 ? this.customWordlist() : this.dictionary;
    const totalWords = wordlist.length;
    let attempts = 0;
    const startTime = Date.now();
    
    this.activityService.log('Password Cracker', `Started cracking ${this.hashType()} hash.`);

    for (const word of wordlist) {
      if (signal.aborted) {
        this.attemptsLog.update(log => [`[STOPPED] Cracking process aborted by user.`, ...log]);
        break;
      }

      attempts++;
      const hashedWord = await this.hash(this.hashType(), word);
      this.attemptsLog.update(log => [`Attempt #${attempts}: Hashing "${word}" -> ${hashedWord.substring(0,20)}...`, ...log.slice(0, 9)]);
      this.progress.set((attempts / totalWords) * 100);

      if (hashedWord === targetHash) {
        this.finishCrack(startTime, attempts, true, word, targetHash);
        return;
      }
      
      // Yield to the event loop to keep the UI responsive
      if (attempts % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    if (!signal.aborted) {
      this.finishCrack(startTime, attempts, false, undefined, targetHash);
    }
  }

  stop() {
    if (this.crackAbortController) {
      this.crackAbortController.abort();
      this.isCracking.set(false);
    }
  }

  private finishCrack(startTime: number, attempts: number, found: boolean, password: string | undefined, finalHash: string) {
    this.isCracking.set(false);
    const endTime = Date.now();
    const result: CrackResult = {
      found,
      password,
      attempts,
      time: (endTime - startTime) / 1000,
      hash: finalHash,
    };
    this.crackResult.set(result);
    this.progress.set(100);
    
    if (found) {
        this.attemptsLog.update(log => [`[SUCCESS] Password found: ${password}`, ...log]);
        this.activityService.log('Password Cracker', `Successfully cracked hash. Found: "${password}".`);
    } else {
        this.attemptsLog.update(log => [`[FAILURE] Password not in dictionary.`, ...log]);
        this.activityService.log('Password Cracker', `Failed to crack hash. Not in dictionary.`);
    }
  }

  private async hash(algorithm: string, text: string): Promise<string> {
    const algo = algorithm === 'SHA-1' ? 'SHA-1' : algorithm === 'SHA-256' ? 'SHA-256' : 'SHA-512';
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algo, data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  handleFileInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.customWordlistName.set(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        this.customWordlist.set(text.split(/\r?\n/).filter(line => line.length > 0));
        this.wordlistSource.set('custom');
      };
      reader.readAsText(file);
    }
  }

  explanation = signal('');
  isFetchingExplanation = signal(false);

  getExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation('Password Cracking')
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'Password Cracker Tutorial',
      steps: [
        {
          title: 'Step 1: Input a Hash',
          content: "Paste the password hash you want to crack into the 'Password Hash' field. A default SHA-256 hash for 'password' is provided."
        },
        {
          title: 'Step 2: Select Hash Type',
          content: "Choose the correct hashing algorithm (e.g., SHA-256) from the dropdown menu that matches your hash."
        },
        {
          title: 'Step 3: Choose a Wordlist',
          content: "You can use the small 'Default' wordlist for quick tests or upload your own text file of potential passwords using the 'Upload' button for a more realistic attack."
        },
        {
          title: 'Step 4: Start Cracking',
          content: "Click 'Start Cracking'. The tool will hash each word from the list and compare it to your target hash. The 'Attack Log' will show real-time progress."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
