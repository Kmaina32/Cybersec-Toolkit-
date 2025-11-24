import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivityService } from '../../services/activity.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  activityService = inject(ActivityService);

  tools = [
    { name: 'Port Scanner', description: 'Scan a target for open web ports.', path: '/port-scanner', icon: 'fa-network-wired' },
    { name: 'Password Cracker', description: 'Crack password hashes with a dictionary attack.', path: '/password-cracker', icon: 'fa-key' },
    { name: 'SQLi Simulator', description: 'Learn how SQL injection bypasses logins.', path: '/sql-injection', icon: 'fa-database' },
    { name: 'XSS Playground', description: 'Safely test Cross-Site Scripting payloads.', path: '/xss-playground', icon: 'fa-code' },
    { name: 'Cryptography Lab', description: 'Experiment with classic and modern ciphers.', path: '/cryptography-lab', icon: 'fa-lock' },
    { name: 'Speed Test', description: 'Measure your internet connection speed.', path: '/speed-test', icon: 'fa-tachometer-alt' },
    { name: 'My IP Address', description: 'Find your public IP and location.', path: '/ip-finder', icon: 'fa-map-marker-alt' },
    { name: 'Knowledge Base', description: 'Learn about hundreds of cyber concepts.', path: '/knowledge-base', icon: 'fa-book' },
    { name: 'Forensics Tools', description: 'Analyze a disk image for evidence.', path: '/digital-forensics', icon: 'fa-magnifying-glass' },
    { name: 'Deception Tech', description: 'Deploy a honeypot to trap attackers.', path: '/deception-technology', icon: 'fa-mask' },
    { name: 'Team Analysis', description: 'Collaborate on a forensics case.', path: '/collaborative-analysis', icon: 'fa-users' },
    { name: 'Phone OSINT', description: 'Gather intel on a phone number.', path: '/phone-infoga', icon: 'fa-phone' },
    { name: 'Instagram OSINT', description: 'Investigate an Instagram profile.', path: '/insta-osint', icon: 'fa-brands fa-instagram' },
    { name: 'Product Scraper', description: 'Scrape data from a product page.', path: '/product-scraper', icon: 'fa-cart-shopping' },
    { name: 'Usage Analytics', description: 'View statistics on tool usage.', path: '/analytics', icon: 'fa-chart-simple' },
  ];
}
