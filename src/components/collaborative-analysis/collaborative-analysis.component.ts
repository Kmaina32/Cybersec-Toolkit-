import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivityService } from '../../services/activity.service';
import { GeminiService, GeminiHistory } from '../../services/gemini.service';
import { AnalyticsService } from '../../services/analytics.service';

interface LogEntry {
  line: string;
  type: 'info' | 'finding' | 'alert';
}

interface ChatMessage {
  user: string;
  avatar: string;
  message: string;
  isMe: boolean;
}

@Component({
  selector: 'app-collaborative-analysis',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './collaborative-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollaborativeAnalysisComponent implements OnDestroy {
  activityService = inject(ActivityService);
  geminiService = inject(GeminiService);
  analyticsService = inject(AnalyticsService);

  isAnalyzing = signal(false);
  analysisLog = signal<LogEntry[]>([]);
  chatMessages = signal<ChatMessage[]>([]);
  myMessage = signal('');
  currentLine = signal(-1);
  isAiThinking = signal(false);
  nextSpeaker: 'Alex' | 'Ben' = 'Alex';
  
  private analysisInterval: any;
  
  private readonly ALEX_SYS_INSTRUCTION = "You are Alex, a senior digital forensics analyst. You are professional, direct, and focused on technical details. You are collaborating with a student and another analyst named Ben. Your goal is to analyze a disk image and explain your findings clearly. When you see a new log entry, comment on its technical significance. When the student asks a question or makes a comment, answer it concisely as Alex. Keep your responses short, like in a real-time chat.";
  private readonly BEN_SYS_INSTRUCTION = "You are Ben, a digital forensics analyst. You are collaborative and tend to summarize findings in a broader context. You are working with a student and another analyst named Alex. Your goal is to analyze a disk image and help the student understand the big picture. When Alex makes a technical point, you can elaborate on its implications. When the student asks a question or makes a comment, provide a helpful and encouraging answer as Ben. Keep your responses short, like in a real-time chat.";

  private fullLog: LogEntry[] = [
    { line: 'Booting analysis environment...', type: 'info' },
    { line: 'Mounting image: compromised_server.img', type: 'info' },
    { line: 'Filesystem: EXT4. Starting file carve.', type: 'info' },
    { line: 'Found web server logs: /var/log/apache2/access.log', type: 'finding' },
    { line: 'Analyzing access.log for anomalies...', type: 'info' },
    { line: 'Suspicious entry found from IP 203.0.113.55', type: 'alert' },
    { line: 'GET /shell.php?cmd=ls', type: 'alert' },
    { line: 'Found script: /var/www/html/shell.php', type: 'finding' },
    { line: 'Examining shell.php...', type: 'info' },
    { line: 'File contains a known PHP web shell.', type: 'alert' },
    { line: 'Cross-referencing IP 203.0.113.55 with auth.log...', type: 'info' },
    { line: 'Failed SSH login attempt for user `root` from 203.0.113.55.', type: 'finding' },
    { line: 'Conclusion: Intrusion via web shell upload.', type: 'info' },
    { line: 'Analysis complete.', type: 'info' },
  ];

  startAnalysis() {
    if (this.isAnalyzing()) return;

    this.analyticsService.trackToolUsage('Team Analysis');
    this.isAnalyzing.set(true);
    this.analysisLog.set([]);
    this.chatMessages.set([]);
    this.currentLine.set(-1);
    this.activityService.log('Team Analysis', 'Started a collaborative session.');
    this.addChatMessage({ user: 'System', avatar: 'S', message: 'Analysis started. Alex and Ben are joining the session.', isMe: false });

    let logIndex = 0;
    this.analysisInterval = setInterval(() => {
      if (logIndex < this.fullLog.length) {
        const newLogEntry = this.fullLog[logIndex];
        this.analysisLog.update(log => [...log, newLogEntry]);
        this.currentLine.set(logIndex);

        if (newLogEntry.type === 'finding' || newLogEntry.type === 'alert') {
          this.getAiLogComment(newLogEntry.line);
        }

        logIndex++;
      } else {
        clearInterval(this.analysisInterval);
        this.isAnalyzing.set(false);
        this.addChatMessage({ user: 'System', avatar: 'S', message: 'Analysis complete.', isMe: false });
      }
    }, 2500);
  }

  private async getAiLogComment(logLine: string) {
      if (this.isAiThinking()) return;
      this.isAiThinking.set(true);

      const speaker = this.nextSpeaker;
      const instruction = speaker === 'Alex' ? this.ALEX_SYS_INSTRUCTION : this.BEN_SYS_INSTRUCTION;
      const prompt = `A new log entry appeared: "${logLine}". What is your immediate thought or comment on this?`;
      
      const history = this.getGeminiHistory();
      const aiResponse = await this.geminiService.generateChatMessage(history, prompt, instruction);

      const newMessage: ChatMessage = {
          user: speaker,
          avatar: speaker.charAt(0),
          message: aiResponse,
          isMe: false
      };
      this.addChatMessage(newMessage);
      
      this.nextSpeaker = speaker === 'Alex' ? 'Ben' : 'Alex';
      this.isAiThinking.set(false);
  }

  private addChatMessage(chatMessage: ChatMessage) {
      this.chatMessages.update(msgs => [...msgs, chatMessage]);
  }

  private getGeminiHistory(): GeminiHistory[] {
      return this.chatMessages()
        .map(msg => {
            if (msg.user === 'System') return null;
            return {
                role: msg.isMe ? 'user' : 'model',
                parts: [{ text: msg.isMe ? msg.message : `${msg.user}: ${msg.message}` }]
            } as GeminiHistory;
        })
        .filter((m): m is GeminiHistory => m !== null);
  }
  
  async sendMessage() {
      const messageText = this.myMessage().trim();
      if (!messageText || this.isAiThinking()) return;
      
      const myMessage: ChatMessage = {
          user: 'You',
          avatar: 'Y',
          message: messageText,
          isMe: true
      };
      this.addChatMessage(myMessage);
      this.myMessage.set('');
      this.isAiThinking.set(true);
      
      const speaker = this.nextSpeaker;
      const instruction = speaker === 'Alex' ? this.ALEX_SYS_INSTRUCTION : this.BEN_SYS_INSTRUCTION;
      const lastFewLogs = this.analysisLog().slice(-3).map(l => l.line).join('\n');
      const prompt = `The user just said: "${messageText}". The last few log lines are:\n${lastFewLogs}\n\nWhat is your response?`;

      const history = this.getGeminiHistory();
      const aiResponse = await this.geminiService.generateChatMessage(history, prompt, instruction);

      const newAiMessage: ChatMessage = {
          user: speaker,
          avatar: speaker.charAt(0),
          message: aiResponse,
          isMe: false
      };
      this.addChatMessage(newAiMessage);

      this.nextSpeaker = speaker === 'Alex' ? 'Ben' : 'Alex';
      this.isAiThinking.set(false);
  }

  ngOnDestroy(): void {
    clearInterval(this.analysisInterval);
  }
}
