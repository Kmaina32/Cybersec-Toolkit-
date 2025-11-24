// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { PasswordCrackerComponent } from './password-cracker.component';
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

// Mock Web Crypto API
const mockDigest = jest.fn();
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
  writable: true,
});

// Helper to wait for async operations and signal updates
const tick = (duration = 0) => new Promise(resolve => setTimeout(resolve, duration));

describe('PasswordCrackerComponent', () => {
  let component: PasswordCrackerComponent;

  // Helper to convert string to ArrayBuffer
  const textToArrayBuffer = (str) => {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
  };
  
  // Helper to convert hex string to ArrayBuffer
  const hexToArrayBuffer = (hex) => {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16));
    }
    return new Uint8Array(bytes).buffer;
  };


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordCrackerComponent],
      providers: [
        { provide: GeminiService, useValue: mockGeminiService },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: TutorialService, useValue: mockTutorialService },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PasswordCrackerComponent);
    component = fixture.componentInstance;
    
    // Mock dictionary for predictable tests
    // @ts-ignore
    component.dictionary = ['test', 'password', '123456'];
    
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should find a password that is in the default dictionary', async () => {
    const targetHash = '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'; // SHA-256 for 'password'
    
    mockDigest.mockImplementation(async (algo, data) => {
        const text = new TextDecoder().decode(data);
        if (text === 'password') return hexToArrayBuffer(targetHash);
        return hexToArrayBuffer('someotherhash');
    });

    component.hashInput.set(targetHash);
    component.hashType.set('SHA-256');

    component.crack();
    await tick(50); // Allow async cracking to proceed

    expect(component.isCracking()).toBe(false);
    expect(component.crackResult()?.found).toBe(true);
    expect(component.crackResult()?.password).toBe('password');
    expect(component.crackResult()?.attempts).toBe(2); // 'test', 'password'
    expect(mockActivityService.log).toHaveBeenCalledWith('Password Cracker', 'Successfully cracked hash. Found: "password".');
  });

  it('should report failure if password is not in the dictionary', async () => {
    const targetHash = 'unknownhash';
    mockDigest.mockResolvedValue(hexToArrayBuffer('someotherhash'));

    component.hashInput.set(targetHash);
    component.crack();
    await tick(50);

    expect(component.isCracking()).toBe(false);
    expect(component.crackResult()?.found).toBe(false);
    expect(component.crackResult()?.password).toBeUndefined();
    expect(component.crackResult()?.attempts).toBe(3); // All words in dictionary
    expect(mockActivityService.log).toHaveBeenCalledWith('Password Cracker', `Failed to crack hash. Not in dictionary.`);
  });
  
  it('should stop cracking when stop() is called', async () => {
    mockDigest.mockResolvedValue(hexToArrayBuffer('someotherhash'));
    component.hashInput.set('somehash');
    
    component.crack();
    await tick(10); // Let it start
    expect(component.isCracking()).toBe(true);

    component.stop();
    await tick(10);

    expect(component.isCracking()).toBe(false);
    // The result should not be set because it was aborted
    expect(component.crackResult()).toBeNull(); 
    expect(component.attemptsLog()[0]).toContain('[STOPPED]');
  });

  it('should handle file input and set custom wordlist', () => {
    const fileContent = 'word1\nword2\nword3';
    const file = new File([fileContent], 'words.txt', { type: 'text/plain' });
    const mockEvent = { target: { files: [file] } };

    // Mock FileReader
    const mockReader = {
      onload: null,
      readAsText: jest.fn(),
      result: fileContent,
    };
    jest.spyOn(window, 'FileReader').mockImplementation(() => mockReader as any);

    component.handleFileInput(mockEvent as any);

    // Manually trigger onload
    if (mockReader.onload) {
      mockReader.onload({ target: { result: fileContent } } as any);
    }
    
    expect(component.customWordlistName()).toBe('words.txt');
    expect(component.customWordlist()).toEqual(['word1', 'word2', 'word3']);
    expect(component.wordlistSource()).toBe('custom');
  });
});
