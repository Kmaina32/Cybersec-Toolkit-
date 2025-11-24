// @ts-nocheck
import { GeminiService } from './gemini.service';
import { GoogleGenAI } from '@google/genai';
import { signal } from '@angular/core';

// Mock the entire @google/genai library
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn(),
    },
  })),
}));

// Helper to wait for effects to run
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

const MockGoogleGenAI = GoogleGenAI as jest.Mock;

describe('GeminiService', () => {
  let service: GeminiService;
  let mockGenerateContent: jest.Mock;

  describe('with API_KEY', () => {
    beforeEach(() => {
      process.env['API_KEY'] = 'test-key';
      mockGenerateContent = jest.fn();
      MockGoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: mockGenerateContent,
        },
      }));
      service = new GeminiService();
    });

    afterEach(() => {
      delete process.env['API_KEY'];
      jest.clearAllMocks();
    });

    it('should initialize GoogleGenAI with the API key', () => {
      expect(MockGoogleGenAI).toHaveBeenCalledWith({ apiKey: 'test-key' });
      expect(service.error()).toBeNull();
    });

    it('should return an explanation on successful API call', async () => {
      const mockResponse = { text: 'This is a test explanation.' };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const explanation = await service.generateExplanation('test topic');
      await tick();

      expect(explanation).toBe('This is a test explanation.');
      expect(service.error()).toBeNull();
      expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
        contents: 'Explain the cybersecurity concept of: "test topic".'
      }));
    });

    it('should set error signal and return a message on API failure', async () => {
      const apiError = new Error('API limit reached');
      mockGenerateContent.mockRejectedValue(apiError);

      const explanation = await service.generateExplanation('failing topic');
      await tick();

      expect(explanation).toBe('Error: Could not fetch explanation for failing topic.');
      expect(service.error()).toBe('Failed to get explanation from AI. Details: API limit reached');
    });

    it('should return a message if the AI service is not available', async () => {
      // @ts-ignore - force setting private property for test
      service.ai = null;
      const explanation = await service.generateExplanation('any topic');
      expect(explanation).toBe('AI Service is not available.');
    });
  });

  describe('without API_KEY', () => {
    beforeEach(() => {
      delete process.env['API_KEY'];
      service = new GeminiService();
    });

    it('should not initialize GoogleGenAI and set an error', () => {
      expect(MockGoogleGenAI).not.toHaveBeenCalled();
      expect(service.error()).toContain('API_KEY environment variable not set');
    });

    it('should not make an API call if initialized with an error', async () => {
      const explanation = await service.generateExplanation('any topic');
      expect(explanation).toBe('AI Service is not available.');
      // Ensure no calls were attempted
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });
});
