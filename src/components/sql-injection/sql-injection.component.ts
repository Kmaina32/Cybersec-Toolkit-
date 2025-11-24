import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

interface User {
  id: number;
  username: string;
  role: string;
  password_hash: string;
}

interface QueryResult {
  query: string;
  success: boolean;
  rowCount: number;
  data: User[];
  explanation: string;
}

@Component({
  selector: 'app-sql-injection',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sql-injection.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlInjectionComponent {
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);
  
  queryInput = signal(`SELECT * FROM users WHERE username = 'admin' AND password = 'password123';`);
  queryResult = signal<QueryResult | null>(null);

  // Mock in-memory database
  private db: { users: User[] } = {
    users: [
      { id: 1, username: 'admin', role: 'administrator', password_hash: '21232f297a57a5a743894a0e4a801fc3' },
      { id: 2, username: 'alice', role: 'editor', password_hash: '1a1dc91c907325c69271ddf0c944bc72' },
      { id: 3, username: 'bob', role: 'viewer', password_hash: '9cdfb439c7876e703e307864c9167a15' },
    ]
  };

  executeQuery() {
    const query = this.queryInput().trim();
    if (!query) return;

    this.analyticsService.trackToolUsage('SQLi Simulator');
    this.activityService.log('SQLi Simulator', `Executed query.`);

    // Very basic simulation of SQL injection
    if (query.toLowerCase().includes("' or '1'='1")) {
      this.queryResult.set({
        query: query,
        success: true,
        rowCount: this.db.users.length,
        data: this.db.users,
        explanation: "Authentication bypassed! The injected condition 'OR '1'='1' is always true, causing the database to return all users from the table, regardless of the original WHERE clause."
      });
      return;
    }
    
    // Basic simulation of a valid query
    const usernameMatch = query.match(/username\s*=\s*'([^']+)'/i);
    const passwordMatch = query.match(/password\s*=\s*'([^']+)'/i);
    
    if (usernameMatch && passwordMatch) {
       // A "real" app would hash the password and compare, but we'll fake it for the demo
      if (usernameMatch[1] === 'admin' && passwordMatch[1] === 'password123') {
         this.queryResult.set({
          query: query,
          success: true,
          rowCount: 1,
          data: [this.db.users[0]],
          explanation: "Authentication successful. The query returned one matching user."
        });
      } else {
        this.queryResult.set({
          query: query,
          success: false,
          rowCount: 0,
          data: [],
          explanation: "Authentication failed. The query returned no matching users."
        });
      }
      return;
    }

    // Default catch-all for other simple queries (e.g., SELECT * FROM users)
    if(query.toLowerCase().startsWith('select * from users')){
        this.queryResult.set({
            query: query,
            success: true,
            rowCount: this.db.users.length,
            data: this.db.users,
            explanation: "Query returned all users from the table."
        });
        return;
    }

    // Invalid query
    this.queryResult.set({
        query: query,
        success: false,
        rowCount: 0,
        data: [],
        explanation: "Query did not match a valid user or a known injection pattern for this simulation."
    });
  }

  setPayload(type: 'normal' | 'injection') {
    if (type === 'normal') {
      this.queryInput.set(`SELECT * FROM users WHERE username = 'admin' AND password = 'password123';`);
    } else {
      this.queryInput.set(`SELECT * FROM users WHERE username = 'admin' AND password = '' OR '1'='1';`);
    }
  }

  explanation = signal('');
  isFetchingExplanation = signal(false);

  getExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation('SQL Injection')
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'SQL Injection Tutorial',
      steps: [
        {
          title: 'Step 1: Understand the Goal',
          content: "The goal is to bypass a simulated login by manipulating the SQL query. The application's backend code foolishly combines your input directly into the query string."
        },
        {
          title: 'Step 2: Try a Normal Login',
          content: "Click the 'Normal Login' button to see what a standard, unsuccessful query looks like. Notice it returns 0 rows."
        },
        {
          title: 'Step 3: Try an Injection Attack',
          content: "Click the 'Injection Attack' button. Notice the `' OR '1'='1'` payload. This crafty input makes the `WHERE` clause of the SQL query always evaluate to true."
        },
        {
          title: 'Step 4: Execute and Observe',
          content: "Click 'Execute Query' with the injection payload. The database returns all users from the table, successfully bypassing the login. Analyze the results to see why it worked."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
