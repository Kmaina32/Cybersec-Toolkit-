import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { GeminiService } from '../../services/gemini.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { FormsModule } from '@angular/forms';
import { AnalyticsService } from '../../services/analytics.service';

interface Topic {
  name: string;
  description: string;
}

interface Category {
  name: string;
  icon: string;
  topics: Topic[];
  isOpen: boolean;
}

@Component({
  selector: 'app-knowledge-base',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './knowledge-base.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBaseComponent {
  geminiService = inject(GeminiService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);
  
  categories = signal<Category[]>([
    {
      name: 'Web Security',
      icon: 'fa-globe',
      isOpen: true,
      topics: [
        { name: 'Cross-Site Scripting (XSS)', description: 'Injecting malicious scripts into websites.' },
        { name: 'SQL Injection (SQLi)', description: 'Manipulating database queries.' },
        { name: 'Cross-Site Request Forgery (CSRF)', description: 'Forcing a user to execute unwanted actions.' },
        { name: 'Clickjacking', description: 'Tricking a user into clicking something different.' },
        { name: 'Insecure Deserialization', description: 'Exploiting mishandled serialized data.' },
        { name: 'Content Security Policy (CSP)', description: 'A defense mechanism against XSS.' },
        { name: 'Web Application Firewalls (WAF)', description: 'Protects web apps by filtering and monitoring HTTP traffic.' },
        { name: 'Web Scraping', description: 'Extracting data from websites, often automated.' }
      ]
    },
    {
      name: 'Network Security',
      icon: 'fa-network-wired',
      isOpen: false,
      topics: [
        { name: 'Man-in-the-Middle (MitM) Attack', description: 'Intercepting communication between two parties.' },
        { name: 'Denial-of-Service (DoS/DDoS)', description: 'Overwhelming a service to make it unavailable.' },
        { name: 'Firewalls', description: 'A barrier that controls incoming and outgoing network traffic.' },
        { name: 'VPN (Virtual Private Network)', description: 'Creating a secure connection over a public network.' },
        { name: 'ARP Spoofing', description: 'Linking an attacker\'s MAC address with an authorized IP.' },
        { name: 'DNS Hijacking', description: 'Redirecting queries to a malicious DNS server.' },
        { name: 'Intrusion Detection and Prevention Systems (IDPS)', description: 'Monitors network activity for malicious behavior and can block threats.' }
      ]
    },
    {
        name: 'Cryptography',
        icon: 'fa-lock',
        isOpen: false,
        topics: [
            { name: 'Symmetric vs Asymmetric Encryption', description: 'The two main types of encryption.' },
            { name: 'Public Key Infrastructure (PKI)', description: 'Managing digital certificates and public keys.' },
            { name: 'Hashing Algorithms (SHA-256)', description: 'Creating a fixed-size hash from data.' },
            { name: 'Digital Signatures', description: 'Ensuring authenticity and integrity of messages.' },
            { name: 'SSL/TLS', description: 'The protocol for secure web communication (HTTPS). '},
        ]
    },
     {
      name: 'Malware',
      icon: 'fa-virus',
      isOpen: false,
      topics: [
        { name: 'Viruses', description: 'Malicious code that replicates by infecting other programs.' },
        { name: 'Worms', description: 'Standalone malware that replicates to spread to other computers.' },
        { name: 'Trojans', description: 'Malware disguised as legitimate software.' },
        { name: 'Ransomware', description: 'Encrypts files and demands a ransom for decryption.' },
        { name: 'Spyware', description: 'Secretly gathers information about a person or organization.' },
        { name: 'Adware', description: 'Software that displays unwanted advertisements.' },
      ]
    },
    {
      name: 'Security Tools & Software',
      icon: 'fa-toolbox',
      isOpen: false,
      topics: [
        { name: 'Vulnerability Scanners', description: 'Scans systems, networks, or applications for security weaknesses.' },
        { name: 'Antivirus & Anti-malware', description: 'Detects, prevents, and removes malicious software from systems.' },
        { name: 'Packet Sniffers', description: 'Captures and analyzes data packets on a network.' },
        { name: 'SIEM Solutions', description: 'Aggregates and analyzes security data from across an organization.' },
        { name: 'Endpoint Detection & Response (EDR)', description: 'Monitors endpoints (computers, servers) for threats.' }
      ]
    },
    {
      name: 'General Concepts',
      icon: 'fa-brain',
      isOpen: false,
      topics: [
        { name: 'Social Engineering', description: 'Psychologically manipulating people to divulge information.' },
        { name: 'Phishing', description: 'Fraudulent attempts to obtain sensitive information.' },
        { name: 'Zero-Day Vulnerability', description: 'A flaw that is unknown to those who should be interested.' },
        { name: 'The CIA Triad', description: 'Confidentiality, Integrity, and Availability.' },
        { name: 'Penetration Testing', description: 'Authorized simulated cyberattack on a computer system.' },
        { name: 'Threat Modeling', description: 'Identifying and prioritizing potential threats.' },
        { name: 'Identity and Access Management (IAM)', description: 'Manages user identities and controls access to systems and data.' }
      ]
    }
  ]);

  searchTerm = signal('');
  selectedTopic = signal<string | null>(null);
  explanation = signal('');
  isFetchingExplanation = signal(false);
  isExpanded = signal(false);
  readonly TRUNCATION_LIMIT = 500;

  filteredCategories = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.categories();
    }

    return this.categories()
      .map(category => ({
        ...category,
        topics: category.topics.filter(
          topic =>
            topic.name.toLowerCase().includes(term) ||
            topic.description.toLowerCase().includes(term)
        ),
        // Force-expand categories that have search results
        isOpen: category.topics.some(
            topic =>
              topic.name.toLowerCase().includes(term) ||
              topic.description.toLowerCase().includes(term)
          )
      }))
      .filter(category => category.topics.length > 0);
  });

  showToggle = computed(() => {
    return this.explanation().length > this.TRUNCATION_LIMIT;
  });

  displayExplanation = computed(() => {
    const fullText = this.explanation();
    if (!this.showToggle() || this.isExpanded()) {
        return fullText;
    }
    return fullText.substring(0, this.TRUNCATION_LIMIT) + '...';
  });

  toggleCategory(categoryName: string) {
    // If searching, toggling is disabled to always show results.
    if(this.searchTerm()) return;

    this.categories.update(cats => cats.map(c => 
      c.name === categoryName ? { ...c, isOpen: !c.isOpen } : c
    ));
  }

  getExplanation(topic: string) {
    this.analyticsService.trackToolUsage('Knowledge Base');
    this.isFetchingExplanation.set(true);
    this.selectedTopic.set(topic);
    this.explanation.set('');
    this.isExpanded.set(false); // Reset expanded state for new topic
    this.geminiService.generateExplanation(topic)
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }
  
  toggleExplanation() {
    this.isExpanded.update(value => !value);
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'Knowledge Base Tutorial',
      steps: [
        {
          title: 'Step 1: Browse Topics',
          content: "The list on the left is organized by category. Click on a category name (e.g., 'Web Security') to expand it and see the topics within."
        },
        {
          title: 'Step 2: Search for a Topic',
          content: "Use the search bar at the top of the list to filter topics by name or description. This will help you find what you're looking for quickly."
        },
        {
          title: 'Step 3: Select a Topic',
          content: "Click on any topic name that interests you, such as 'Cross-Site Scripting (XSS)', to select it."
        },
        {
          title: 'Step 4: Read the Explanation',
          content: "The panel on the right will display a detailed explanation of the selected topic, generated by our AI cybersecurity expert. You can select another topic at any time."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
