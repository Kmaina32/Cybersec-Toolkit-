// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { CryptographyLabComponent } from './cryptography-lab.component';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { TutorialService } from '../../services/tutorial.service';
import { signal } from '@angular/core';

// Mock services
const mockGeminiService = {
  generateExplanation: jest.fn(),
  error: signal(null),
};
const mockActivityService = {
  log: jest.fn(),
};
const mockTutorialService = {
  show: jest.fn(),
};

// Mock Web Crypto API for AES
const mockAesKey = { name: 'mockKey' };
const mockImportKey = jest.fn().mockResolvedValue(mockAesKey);
const mockEncrypt = jest.fn();
const mockDecrypt = jest.fn();
const mockGetRandomValues = jest.fn().mockReturnValue(new Uint8Array(12).fill(0)); // Deterministic IV

Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: mockGetRandomValues,
    subtle: {
      importKey: mockImportKey,
      encrypt: mockEncrypt,
      decrypt: mockDecrypt,
    },
  },
  writable: true,
});

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

describe('CryptographyLabComponent', () => {
  let component: CryptographyLabComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CryptographyLabComponent],
      providers: [
        { provide: GeminiService, useValue: mockGeminiService },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: TutorialService, useValue: mockTutorialService },
      ],
    }).compileComponents();
    
    const fixture = TestBed.createComponent(CryptographyLabComponent);
    component = fixture.componentInstance;
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Caesar Cipher', () => {
    beforeEach(() => {
      component.algorithm.set('caesar');
      component.key.set('3');
    });

    it('should encrypt correctly', () => {
      component.inputText.set('Hello World');
      component.mode.set('encrypt');
      component.processText();
      expect(component.outputText()).toBe('Khoor Zruog');
    });

    it('should decrypt correctly', () => {
      component.inputText.set('Khoor Zruog');
      component.mode.set('decrypt');
      component.processText();
      expect(component.outputText()).toBe('Hello World');
    });

    it('should wrap around from Z to A', () => {
      component.inputText.set('XYZ');
      component.mode.set('encrypt');
      component.processText();
      expect(component.outputText()).toBe('ABC');
    });
  });

  describe('Vigenère Cipher', () => {
    beforeEach(() => {
      component.algorithm.set('vigenere');
      component.key.set('KEY');
    });

    it('should encrypt correctly', () => {
      component.inputText.set('Attack at dawn');
      component.mode.set('encrypt');
      component.processText();
      expect(component.outputText()).toBe('Kflkvv ef Hizo');
    });

    it('should decrypt correctly', () => {
      component.inputText.set('Kflkvv ef Hizo');
      component.mode.set('decrypt');
      component.processText();
      expect(component.outputText()).toBe('Attack at dawn');
    });

    it('should handle key case insensitivity', () => {
      component.key.set('key'); // lowercase key
      component.inputText.set('Attack at dawn');
      component.mode.set('encrypt');
      component.processText();
      expect(component.outputText()).toBe('Kflkvv ef Hizo');
    });
  });
  
  describe('AES-GCM Cipher', () => {
    beforeEach(() => {
        component.algorithm.set('aes');
        component.key.set('a 16-char secret'); // 16 chars for AES-128
    });

    it('should encrypt correctly', async () => {
        const plaintext = 'This is a secret message.';
        const encryptedBuffer = textEncoder.encode('encrypted_text').buffer;
        mockEncrypt.mockResolvedValue(encryptedBuffer);

        component.inputText.set(plaintext);
        component.mode.set('encrypt');
        await component.processText();
        
        expect(mockImportKey).toHaveBeenCalled();
        expect(mockEncrypt).toHaveBeenCalledWith({ name: 'AES-GCM', iv: expect.any(Uint8Array) }, mockAesKey, textEncoder.encode(plaintext));
        // IV (12 bytes of 0) + encrypted_text
        const expectedBase64 = btoa('\0\0\0\0\0\0\0\0\0\0\0\0encrypted_text');
        expect(component.outputText()).toBe(expectedBase64);
    });

    it('should decrypt correctly', async () => {
        const decryptedText = 'This is the original text.';
        mockDecrypt.mockResolvedValue(textEncoder.encode(decryptedText).buffer);

        // A mock base64 string representing IV + ciphertext
        const inputTextBase64 = btoa('\0\0\0\0\0\0\0\0\0\0\0\0' + 'some_ciphertext');
        component.inputText.set(inputTextBase64);
        component.mode.set('decrypt');
        await component.processText();

        expect(mockImportKey).toHaveBeenCalled();
        expect(mockDecrypt).toHaveBeenCalled();
        expect(component.outputText()).toBe(decryptedText);
    });
    
    it('should set an error if the key has an invalid length', async () => {
      component.key.set('shortkey');
      await component.processText();
      expect(component.error()).toContain('AES key must be 16, 24, or 32 characters');
      expect(component.outputText()).toBe('');
    });

    it('should set an error on decryption failure', async () => {
      mockDecrypt.mockRejectedValue(new Error('Decryption failed'));
      component.inputText.set(btoa('mock_iv_and_ciphertext'));
      component.mode.set('decrypt');
      await component.processText();

      expect(component.error()).toContain('Decryption failed. The key may be incorrect');
      expect(component.outputText()).toBe('');
    });
  });

});
