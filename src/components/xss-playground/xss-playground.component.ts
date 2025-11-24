import { ChangeDetectionStrategy, Component, computed, inject, SecurityContext, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { FormsModule } from '@angular/forms';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

interface Comment {
  author: string;
  timestamp: string;
  content: string;
}

@Component({
  selector: 'app-xss-playground',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './xss-playground.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class XssPlaygroundComponent {
  private sanitizer = inject(DomSanitizer);
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);

  commentInput = signal('');
  comments = signal<Comment[]>([
    { author: 'Alice', timestamp: '2 hours ago', content: 'This is a great blog post!' },
    { author: 'Bob', timestamp: '1 hour ago', content: 'I agree, very informative.' },
  ]);
  sanitizedMode = signal(false);

  // This is the vulnerable part for demonstration.
  // It takes the HTML content and trusts it.
  renderedComments = computed(() => {
    return this.comments().map(comment => {
      const renderedContent = this.sanitizedMode()
        ? this.sanitizer.sanitize(SecurityContext.HTML, comment.content)
        : this.sanitizer.bypassSecurityTrustHtml(comment.content);
      
      return {
        ...comment,
        renderedContent: renderedContent ?? '[SANITIZED CONTENT WAS NULL]',
      };
    });
  });

  addComment() {
    if (this.commentInput().trim()) {
      const newComment: Comment = {
        author: 'StudentHacker',
        timestamp: 'Just now',
        content: this.commentInput(),
      };
      this.analyticsService.trackToolUsage('XSS Playground');
      this.activityService.log('XSS Playground', 'Posted a new comment.');
      this.comments.update(c => [...c, newComment]);
      this.commentInput.set('');
    }
  }

  setPayload(payload: string) {
    switch(payload) {
      case 'alert':
        this.commentInput.set(`<script>alert('XSS Vulnerability Found!')</script>`);
        break;
      case 'image':
        this.commentInput.set(`<img src="invalid-source" onerror="alert('Image XSS!')">`);
        break;
      case 'style':
        this.commentInput.set(`<b style="font-size:30px; color:red; display:block;">Styled Content</b>`);
        break;
      case 'cookie':
        this.commentInput.set(`<script>alert('Your cookie is: ' + document.cookie)</script>`);
        break;
    }
  }
  
  explanation = signal('');
  isFetchingExplanation = signal(false);

  getExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation('Cross-Site Scripting (XSS)')
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'XSS Playground Tutorial',
      steps: [
        {
          title: 'Step 1: Understand the Vulnerability',
          content: "This comment section is vulnerable because it renders user input directly as HTML without cleaning it (a process called 'sanitizing'). This allows attackers to inject their own code."
        },
        {
          title: 'Step 2: Post a Malicious Comment',
          content: "Use the 'Example Payloads' buttons to load a sample script, like the 'Alert Popup'. Then, click 'Post Comment' to submit it."
        },
        {
          title: 'Step 3: See the Result',
          content: "The script will execute in the 'Vulnerable Blog Post Comments' section, and an alert box will appear. This demonstrates a successful Cross-Site Scripting (XSS) attack."
        },
        {
          title: 'Step 4: Toggle Sanitization',
          content: "Now, enable the 'Sanitized' toggle switch. The page will reload the comments, but this time the malicious script is displayed as plain text instead of being executed. This is the proper way to prevent XSS."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
