import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

export interface GeminiHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI | null = null;
  public error = signal<string | null>(null);

  constructor() {
    try {
      if (typeof process === 'undefined' || !process.env['API_KEY']) {
        throw new Error('API_KEY environment variable not set.');
      }
      this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] });
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Failed to initialize Gemini Service:', error.message);
      this.error.set(`Could not initialize AI Service. API_KEY might be missing. Details: ${error.message}`);
    }
  }

  async generateExplanation(topic: string): Promise<string> {
    if (!this.ai) {
      return 'AI Service is not available.';
    }
    this.error.set(null);

    try {
      const systemInstruction = "You are a cybersecurity expert and professor. Explain the following concept to a university student. Be clear, comprehensive, and use helpful analogies where possible. Structure your answer clearly, but do not include markdown formatting like ```, ##, or **.";
      const prompt = `Explain the cybersecurity concept of: "${topic}".`;
      
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.5,
        }
      });
      
      return response.text;
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Error generating content:', error);
      this.error.set(`Failed to get explanation from AI. Details: ${error.message}`);
      return `Error: Could not fetch explanation for ${topic}.`;
    }
  }

  async generateChatMessage(history: GeminiHistory[], newMessage: string, systemInstruction: string): Promise<string> {
    if (!this.ai) {
      return 'AI Service is not available.';
    }
    this.error.set(null);

    try {
      const contents = [...history, { role: 'user' as const, parts: [{ text: newMessage }] }];

      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.8,
        }
      });
      
      return response.text;
    } catch (e: unknown) {
      const error = e as Error;
      console.error('Error generating chat content:', error);
      this.error.set(`Failed to get chat response from AI. Details: ${error.message}`);
      return `Error: Could not get a response from AI.`;
    }
  }
}