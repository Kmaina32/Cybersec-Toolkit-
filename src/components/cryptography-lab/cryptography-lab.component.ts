import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../../services/gemini.service';
import { ActivityService } from '../../services/activity.service';
import { Tutorial, TutorialService } from '../../services/tutorial.service';
import { AnalyticsService } from '../../services/analytics.service';

type Algorithm = 'caesar' | 'vigenere' | 'aes';
type Mode = 'encrypt' | 'decrypt';

@Component({
  selector: 'app-cryptography-lab',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './cryptography-lab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CryptographyLabComponent {
  geminiService = inject(GeminiService);
  activityService = inject(ActivityService);
  tutorialService = inject(TutorialService);
  analyticsService = inject(AnalyticsService);

  algorithm = signal<Algorithm>('caesar');
  mode = signal<Mode>('encrypt');
  inputText = signal('');
  key = signal('3');
  outputText = signal('');
  error = signal('');
  aesKeySize = signal<16 | 24 | 32>(16);

  isAes = computed(() => this.algorithm() === 'aes');

  async processText() {
    this.error.set('');
    this.outputText.set('');
    if (!this.inputText() || !this.key()) {
      this.error.set('Input text and key are required.');
      return;
    }

    try {
      this.analyticsService.trackToolUsage('Cryptography Lab');
      const algo = this.algorithm();
      const currentMode = this.mode();
      let result = '';

      if (algo === 'caesar') {
        result = this.caesarCipher(this.inputText(), parseInt(this.key(), 10), currentMode);
      } else if (algo === 'vigenere') {
        result = this.vigenereCipher(this.inputText(), this.key(), currentMode);
      } else if (algo === 'aes') {
        result = await this.aesCipher(this.inputText(), this.key(), currentMode);
      }
      
      this.outputText.set(result);
      this.activityService.log('Cryptography Lab', `Performed ${currentMode} using ${algo.toUpperCase()}.`);
    } catch (e: unknown) {
      const err = e as Error;
      this.error.set(`An error occurred: ${err.message}`);
      this.outputText.set('');
    }
  }

  generateAesKey() {
    const keyLength = this.aesKeySize();
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?';
    const randomValues = new Uint8Array(keyLength);
    crypto.getRandomValues(randomValues);

    let result = '';
    for (let i = 0; i < keyLength; i++) {
      result += charset[randomValues[i] % charset.length];
    }
    this.key.set(result);
  }

  // --- Cipher Implementations ---

  private caesarCipher(text: string, shift: number, mode: Mode): string {
    if (isNaN(shift)) throw new Error('Caesar shift key must be a number.');
    const s = mode === 'encrypt' ? shift : -shift;
    return text.replace(/[a-zA-Z]/g, (char) => {
      const base = char < 'a' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - base + s) % 26 + 26) % 26 + base);
    });
  }

  private vigenereCipher(text: string, key: string, mode: Mode): string {
    if (!/^[a-zA-Z]+$/.test(key)) throw new Error('Vigenère key must only contain letters.');
    let keyIndex = 0;
    const cleanedKey = key.toLowerCase();
    return text.replace(/[a-zA-Z]/g, (char) => {
      const keyChar = cleanedKey[keyIndex % cleanedKey.length];
      const shift = keyChar.charCodeAt(0) - 97;
      const s = mode === 'encrypt' ? shift : -shift;
      const base = char < 'a' ? 65 : 97;
      keyIndex++;
      return String.fromCharCode(((char.charCodeAt(0) - base + s) % 26 + 26) % 26 + base);
    });
  }

  private async aesCipher(text: string, key: string, mode: Mode): Promise<string> {
    if (key.length !== 16 && key.length !== 24 && key.length !== 32) {
      throw new Error('AES key must be 16, 24, or 32 characters long for AES-128, AES-192, or AES-256.');
    }
    const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM standard IV size
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const cryptoKey = await this.importAesKey(encoder.encode(key));

    if (mode === 'encrypt') {
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encoder.encode(text)
      );
      // Prepend IV to the ciphertext for use in decryption
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);
      return this.bufferToBase64(combined);
    } else { // Decrypt
      try {
        const combined = this.base64ToBuffer(text);
        const ivFromData = combined.slice(0, 12);
        const ciphertext = combined.slice(12);
        const decryptedData = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: ivFromData },
          cryptoKey,
          ciphertext
        );
        return decoder.decode(decryptedData);
      } catch(e) {
        throw new Error("Decryption failed. The key may be incorrect or the ciphertext corrupted.");
      }
    }
  }

  private async importAesKey(rawKey: Uint8Array): Promise<CryptoKey> {
    return crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private bufferToBase64(buffer: Uint8Array): string {
    return btoa(String.fromCharCode(...buffer));
  }

  private base64ToBuffer(base64: string): Uint8Array {
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  }
  
  // --- Explanation Logic ---
  explanation = signal('');
  isFetchingExplanation = signal(false);

  algorithmDisplayName = computed(() => {
    switch (this.algorithm()) {
      case 'caesar':
        return 'Caesar Cipher';
      case 'vigenere':
        return 'Vigenère Cipher';
      case 'aes':
        return 'AES-GCM Encryption';
      default:
        return 'Cryptography';
    }
  });

  getAlgorithmExplanation() {
    this.isFetchingExplanation.set(true);
    this.explanation.set('');
    this.geminiService.generateExplanation(this.algorithmDisplayName())
      .then(text => this.explanation.set(text))
      .finally(() => this.isFetchingExplanation.set(false));
  }

  showTutorial() {
    const tutorial: Tutorial = {
      title: 'Cryptography Lab Tutorial',
      steps: [
        {
          title: 'Step 1: Choose an Algorithm',
          content: "Select a cipher from the dropdown menu. You can experiment with the simple 'Caesar Cipher', the polyalphabetic 'Vigenère Cipher', or the modern industry-standard 'AES'."
        },
        {
          title: 'Step 2: Select a Mode',
          content: "Choose whether you want to 'Encrypt' a plaintext message or 'Decrypt' an existing ciphertext."
        },
        {
          title: 'Step 3: Provide a Key',
          content: "Enter the secret key for the chosen algorithm. The required format is described below the input box (e.g., a number for Caesar, a keyword for Vigenère). For AES, you can use the 'Generate Key' button."
        },
        {
          title: 'Step 4: Enter Your Text & Process',
          content: "Type or paste the text you want to process into the 'Input Text' area, then click the 'Process' button. The result will appear in the 'Output' box."
        }
      ]
    };
    this.tutorialService.show(tutorial);
  }
}
