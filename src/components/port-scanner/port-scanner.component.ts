import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

interface PortResult {
  port: number;
  status: 'open' | 'closed' | 'unknown';
}

@Component({
  selector: 'app-port-scanner',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './port-scanner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortScannerComponent {
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);

  targetIp = signal('127.0.0.1');
  isScanning = signal(false);
  scanProgress = signal(0);
  scanResults = signal<PortResult[]>([]);
  scanLog = signal<string[]>([]);
  
  explanation = signal('');
  isFetchingExplanation = signal(false);

  // Common web ports that can be tested with HTTP requests from a browser
  private portsToScan = [80, 443, 3000, 8000, 8080, 8443];

  async scan() {
    if (this.isScanning() || !this.targetIp()) return;

    this.analyticsService.trackToolUsage('Port Scanner');
    this.isScanning.set(true);
    this.scanResults.set([]);
    this.scanLog.set([]);
    this.scanProgress.set(0);

    const target = this.targetIp();
    this.activityService.log('Port Scanner', `Scan initiated on ${target}`);
    this.scanLog.update(log => [...log, `[+] Initializing web port scan on ${target}...`]);
    this.scanLog.update(log => [...log, `[+] Target Ports: ${this.portsToScan.join(', ')}`]);

    const promises = this.portsToScan.map(port => this.scanPort(target, port));

    for (const promise of promises) {
        const result = await promise;
        if(result.status === 'open') {
          this.scanLog.update(log => [...log, `[+] Found open port: ${result.port}`]);
        }
        this.scanResults.update(res => [...res, result]);
        this.scanProgress.update(p => p + (100 / this.portsToScan.length));
    }

    this.scanLog.update(log => [...log, `[+] Scan completed.`]);
    this.activityService.log('Port Scanner', `Scan finished on ${target}. Found ${this.scanResults().filter(r => r.status === 'open').length} open web ports.`);
    this.isScanning.set(false);
  }

  private async scanPort(host: string, port: number): Promise<PortResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 sec timeout

    try {
      // Use "https" for 443/8443, "http" for others.
      const protocol = [443, 8443].includes(port) ? 'https' : 'http';
      // Use a cache-busting query parameter to avoid hitting browser cache
      const url = `${protocol}://${host}:${port}?t=${new Date().getTime()}`;
      
      await fetch(url, { mode: 'no-cors', signal: controller.signal });
      // NOTE: 'no-cors' mode results in an "opaque" response. We can't read the response body or headers.
      // A successful fetch (promise resolves) suggests something is listening on that port.
      // A failed fetch (promise rejects) suggests the port is closed or firewall-blocked.
      clearTimeout(timeoutId);
      return { port, status: 'open' };
    } catch (e) {
      clearTimeout(timeoutId);
      return { port, status: 'closed' };
    }
  }

  getExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation('Port Scanning from a Web Browser')
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'Port Scanner Tutorial',
      steps: [
        {
          title: 'Step 1: Enter a Target',
          content: "Input the IP address or hostname you want to scan into the text field. For local testing, you can use `127.0.0.1`."
        },
        {
          title: 'Step 2: Start the Scan',
          content: "Click the 'Scan Web Ports' button to begin. The tool will send requests to common web ports like 80 (HTTP) and 443 (HTTPS)."
        },
        {
          title: 'Step 3: Analyze the Results',
          content: "The 'Results' panel will show each port and its status ('open' or 'closed'). The 'Log' panel provides a real-time feed of the scanning process. Remember, due to browser limitations, this only detects web services."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
