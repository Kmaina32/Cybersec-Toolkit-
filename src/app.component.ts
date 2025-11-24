import { ChangeDetectionStrategy, Component, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TutorialComponent } from './components/tutorial/tutorial.component';

interface LocationPermissionResult {
  status: 'pass' | 'fail';
  title: string;
  message: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  // FIX: Corrected typo from 'Change.DetectionStrategy' to 'ChangeDetectionStrategy'.
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TutorialComponent],
})
export class AppComponent implements OnInit {
  mobileMenuOpen = signal(false);
  locationPermissionResult = signal<LocationPermissionResult | null>(null);

  navItems = [
    { path: '/dashboard', icon: 'fa-home', name: 'Dashboard' },
    { path: '/port-scanner', icon: 'fa-network-wired', name: 'Port Scanner' },
    { path: '/password-cracker', icon: 'fa-key', name: 'Password Cracker' },
    { path: '/sql-injection', icon: 'fa-database', name: 'SQLi Simulator' },
    { path: '/xss-playground', icon: 'fa-code', name: 'XSS Playground' },
    { path: '/cryptography-lab', icon: 'fa-lock', name: 'Cryptography Lab' },
    { path: '/speed-test', icon: 'fa-tachometer-alt', name: 'Speed Test' },
    { path: '/ip-finder', icon: 'fa-map-marker-alt', name: 'My IP Address' },
    { path: '/knowledge-base', icon: 'fa-book', name: 'Knowledge Base' },
    { path: '/digital-forensics', icon: 'fa-magnifying-glass', name: 'Forensics Tools' },
    // FIX: Added leading slash for consistent absolute routing.
    { path: '/deception-technology', icon: 'fa-mask', name: 'Deception Tech' },
    { path: '/collaborative-analysis', icon: 'fa-users', name: 'Team Analysis' },
    { path: '/phone-infoga', icon: 'fa-phone', name: 'Phone OSINT' },
    { path: '/insta-osint', icon: 'fa-brands fa-instagram', name: 'Instagram OSINT' },
    { path: '/product-scraper', icon: 'fa-cart-shopping', name: 'Product Scraper' },
    { path: '/analytics', icon: 'fa-chart-simple', name: 'Usage Analytics' },
  ];

  ngOnInit() {
    // Wait a bit before asking, so it's not too intrusive on page load.
    setTimeout(() => this.checkLocationPermission(), 2000);
  }

  checkLocationPermission() {
    // Check if geolocation is supported by the browser
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // Success callback (user allowed)
        () => {
          this.locationPermissionResult.set({
            status: 'fail',
            title: 'Lesson 101: Failed!',
            message: "You granted location access. While this website is safe, blindly trusting sites with your location is a security risk. Always be cautious about what permissions you grant. It's a common way for malicious actors to gather information about you."
          });
        },
        // Error callback (user denied or other error)
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            this.locationPermissionResult.set({
              status: 'pass',
              title: 'Lesson 101: Passed!',
              message: "Excellent choice! You denied the location request. It's a fundamental cybersecurity principle to not give away personal information, like your location, unless you are absolutely certain why it's needed and trust the source. Well done!"
            });
          }
          // We can ignore other errors like POSITION_UNAVAILABLE or TIMEOUT for this specific test.
        }
      );
    }
  }
  
  dismissLocationPermissionModal() {
    this.locationPermissionResult.set(null);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(value => !value);
  }

  closeMobileMenu() {
    // FIX: Corrected typo from 'mobileMenuOpe' to 'mobileMenuOpen'.
    this.mobileMenuOpen.set(false);
  }
}