import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(c => c.DashboardComponent),
    data: { title: 'Dashboard' }
  },
  {
    path: 'port-scanner',
    loadComponent: () => import('./components/port-scanner/port-scanner.component').then(c => c.PortScannerComponent),
    data: { title: 'Port Scanner' }
  },
  {
    path: 'password-cracker',
    loadComponent: () => import('./components/password-cracker/password-cracker.component').then(c => c.PasswordCrackerComponent),
    data: { title: 'Password Cracker' }
  },
  {
    path: 'sql-injection',
    loadComponent: () => import('./components/sql-injection/sql-injection.component').then(c => c.SqlInjectionComponent),
    data: { title: 'SQLi Simulator' }
  },
  {
    path: 'xss-playground',
    loadComponent: () => import('./components/xss-playground/xss-playground.component').then(c => c.XssPlaygroundComponent),
    data: { title: 'XSS Playground' }
  },
  {
    path: 'cryptography-lab',
    loadComponent: () => import('./components/cryptography-lab/cryptography-lab.component').then(c => c.CryptographyLabComponent),
    data: { title: 'Cryptography Lab' }
  },
  {
    path: 'speed-test',
    loadComponent: () => import('./components/speed-test/speed-test.component').then(c => c.SpeedTestComponent),
    data: { title: 'Speed Test' }
  },
   {
    path: 'ip-finder',
    loadComponent: () => import('./components/ip-finder/ip-finder.component').then(c => c.IpFinderComponent),
    data: { title: 'My IP Address' }
  },
  {
    path: 'knowledge-base',
    loadComponent: () => import('./components/knowledge-base/knowledge-base.component').then(c => c.KnowledgeBaseComponent),
    data: { title: 'Knowledge Base' }
  },
  {
    path: 'digital-forensics',
    loadComponent: () => import('./components/digital-forensics/digital-forensics.component').then(c => c.DigitalForensicsComponent),
    data: { title: 'Digital Forensics' }
  },
  {
    path: 'deception-technology',
    loadComponent: () => import('./components/deception-technology/deception-technology.component').then(c => c.DeceptionTechnologyComponent),
    data: { title: 'Deception Technology' }
  },
  {
    path: 'collaborative-analysis',
    loadComponent: () => import('./components/collaborative-analysis/collaborative-analysis.component').then(c => c.CollaborativeAnalysisComponent),
    data: { title: 'Collaborative Analysis' }
  },
  {
    path: 'phone-infoga',
    loadComponent: () => import('./components/phone-infoga/phone-infoga.component').then(c => c.PhoneInfogaComponent),
    data: { title: 'Phone OSINT' }
  },
  {
    path: 'insta-osint',
    loadComponent: () => import('./components/insta-osint/insta-osint.component').then(c => c.InstaOsintComponent),
    data: { title: 'Instagram OSINT' }
  },
  {
    path: 'product-scraper',
    loadComponent: () => import('./components/product-scraper/product-scraper.component').then(c => c.ProductScraperComponent),
    data: { title: 'Product Scraper' }
  },
  {
    path: 'analytics',
    loadComponent: () => import('./components/analytics/analytics.component').then(c => c.AnalyticsComponent),
    data: { title: 'Usage Analytics' }
  },
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
