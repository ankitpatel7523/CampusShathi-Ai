import { GoogleGenAI } from '@google/genai';
import { API_CONFIG } from './config.js';

export interface AIProviderResult<T = string> {
  success: boolean;
  data?: T;
  provider: 'groq' | 'gemini' | 'fallback_keyword';
  modelUsed: string;
  error?: string;
  errorKind?: 'NO_KEY' | 'QUOTA_EXCEEDED' | 'MODEL_NOT_FOUND' | 'TIMEOUT' | 'UNKNOWN';
  fixHint?: string;
}

export interface ChatMessageParam {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class MultiAIProvider {
  private geminiKey: string;
  private groqKey: string;
  private groqModel: string;
  private groqSttModel: string;
  private geminiModel: string;
  private geminiEmbeddingModel: string;
  private geminiClient: GoogleGenAI | null = null;

  constructor() {
    this.geminiKey = API_CONFIG.GEMINI_API_KEY;
    this.groqKey = API_CONFIG.GROQ_API_KEY;
    this.groqModel = API_CONFIG.AI_MODELS.GROQ_PRIMARY;
    this.groqSttModel = API_CONFIG.AI_MODELS.GROQ_STT;
    this.geminiModel = API_CONFIG.AI_MODELS.GEMINI_PRIMARY;
    this.geminiEmbeddingModel = API_CONFIG.AI_MODELS.GEMINI_EMBEDDING;
    this.getGeminiClient();
  }

  public getGeminiClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY || this.geminiKey;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return null;
    }
    if (!this.geminiClient || this.geminiKey !== key) {
      this.geminiKey = key;
      try {
        this.geminiClient = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error('Failed to initialize Gemini client:', err);
        this.geminiClient = null;
      }
    }
    return this.geminiClient;
  }

  public classifyError(err: any): { errorKind: 'NO_KEY' | 'QUOTA_EXCEEDED' | 'MODEL_NOT_FOUND' | 'TIMEOUT' | 'UNKNOWN', message: string, fixHint: string } {
    const msg = String(err?.message || err || '');
    if (msg.includes('API_KEY_INVALID') || msg.includes('401') || msg.includes('authentication') || msg.includes('Invalid API Key')) {
      return {
        errorKind: 'NO_KEY',
        message: 'Invalid or missing API key',
        fixHint: 'Please check your GEMINI_API_KEY or GROQ_API_KEY in the environment or secrets panel.'
      };
    }
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('Rate limit')) {
      return {
        errorKind: 'QUOTA_EXCEEDED',
        message: 'API rate limit or quota exceeded',
        fixHint: 'The free tier quota is temporarily busy. Wait a few seconds or configure a backup key.'
      };
    }
    if (msg.includes('404') || msg.includes('not found') || msg.includes('model')) {
      return {
        errorKind: 'MODEL_NOT_FOUND',
        message: 'Requested AI model was not found',
        fixHint: 'Check model name in .env settings. The app will automatically try alternate models.'
      };
    }
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('abort')) {
      return {
        errorKind: 'TIMEOUT',
        message: 'The AI request timed out after 90 seconds',
        fixHint: 'Please try breaking down your question or prompt into smaller parts.'
      };
    }
    return {
      errorKind: 'UNKNOWN',
      message: msg || 'An unexpected AI provider error occurred',
      fixHint: 'Check internet connection and service status.'
    };
  }

  // Probe live models
  public async probe(): Promise<{
    gemini: { status: 'OK' | 'FAIL'; model: string; error?: string };
    groq: { status: 'OK' | 'FAIL'; model: string; error?: string };
  }> {
    const result = {
      gemini: { status: 'FAIL' as 'OK' | 'FAIL', model: this.geminiModel, error: undefined as string | undefined },
      groq: { status: 'FAIL' as 'OK' | 'FAIL', model: this.groqModel, error: undefined as string | undefined },
    };

    // Test Gemini
    const gemini = this.getGeminiClient();
    if (gemini) {
      try {
        const response = await gemini.models.generateContent({
          model: this.geminiModel,
          contents: 'Say OK',
        });
        if (response && response.text) {
          result.gemini.status = 'OK';
        }
      } catch (err: any) {
        result.gemini.error = err.message || 'Gemini probe failed';
      }
    } else {
      result.gemini.error = 'GEMINI_API_KEY not configured or set to placeholder';
    }

    // Test Groq
    if (this.groqKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.groqKey}`
          },
          body: JSON.stringify({
            model: this.groqModel,
            messages: [{ role: 'user', content: 'Say OK' }],
            max_tokens: 5
          })
        });
        if (res.ok) {
          result.groq.status = 'OK';
        } else {
          const errJson = await res.json().catch(() => ({}));
          result.groq.error = errJson?.error?.message || `HTTP ${res.status}`;
        }
      } catch (err: any) {
        result.groq.error = err.message || 'Groq connection failed';
      }
    } else {
      result.groq.error = 'GROQ_API_KEY not provided (Gemini will be used)';
    }

    return result;
  }

  // Generate Text with Groq primary and Gemini fallback
  public async generateText(
    messages: ChatMessageParam[],
    systemInstruction?: string,
    preferredProvider: 'groq' | 'gemini' = 'groq'
  ): Promise<AIProviderResult<string>> {
    // Attempt 1: preferred provider
    if (preferredProvider === 'groq' && this.groqKey) {
      try {
        const groqResult = await this.callGroqChat(messages, systemInstruction);
        return {
          success: true,
          data: groqResult,
          provider: 'groq',
          modelUsed: this.groqModel
        };
      } catch (err) {
        console.warn('Groq failed, attempting Gemini fallback:', err);
      }
    }

    // Attempt 2: Gemini
    const gemini = this.getGeminiClient();
    if (gemini) {
      try {
        const fullPrompt = [
          systemInstruction ? `[SYSTEM INSTRUCTION]\n${systemInstruction}\n` : '',
          ...messages.map(m => `${m.role.toUpperCase()}: ${m.content}`)
        ].join('\n\n');

        const response = await gemini.models.generateContent({
          model: this.geminiModel,
          contents: fullPrompt
        });

        const text = response.text?.trim() || '';
        return {
          success: true,
          data: text,
          provider: 'gemini',
          modelUsed: this.geminiModel
        };
      } catch (geminiErr: any) {
        const classified = this.classifyError(geminiErr);
        return {
          success: false,
          provider: 'gemini',
          modelUsed: this.geminiModel,
          error: classified.message,
          errorKind: classified.errorKind,
          fixHint: classified.fixHint
        };
      }
    }

    return {
      success: false,
      provider: 'gemini',
      modelUsed: this.geminiModel,
      error: 'No active AI key available (GEMINI_API_KEY or GROQ_API_KEY)',
      errorKind: 'NO_KEY',
      fixHint: 'Configure GEMINI_API_KEY in the environment or secrets panel to enable real AI generation.'
    };
  }

  // Generate Structured JSON
  public async generateJson<T = any>(
    prompt: string,
    systemInstruction?: string,
    preferredProvider: 'groq' | 'gemini' = 'groq'
  ): Promise<AIProviderResult<T>> {
    const formattedPrompt = `${prompt}\n\nIMPORTANT: Return ONLY a valid JSON object or array. No markdown code blocks, no backticks, no explanations.`;

    const result = await this.generateText(
      [{ role: 'user', content: formattedPrompt }],
      systemInstruction,
      preferredProvider
    );

    if (!result.success || !result.data) {
      return {
        ...result,
        data: undefined
      };
    }

    try {
      // Clean up json text if model included markdown fences
      let raw = result.data.trim();
      if (raw.startsWith('```json')) {
        raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (raw.startsWith('```')) {
        raw = raw.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const parsed = JSON.parse(raw);
      return {
        success: true,
        data: parsed,
        provider: result.provider,
        modelUsed: result.modelUsed
      };
    } catch (parseErr) {
      return {
        success: false,
        provider: result.provider,
        modelUsed: result.modelUsed,
        error: 'Model did not return valid JSON syntax',
        errorKind: 'UNKNOWN',
        fixHint: 'Retry the generation with slightly simpler requirements.'
      };
    }
  }

  // Vision OCR / Describe image (Gemini primary)
  public async describeImage(
    imageBase64: string,
    mimeType: string,
    prompt: string
  ): Promise<AIProviderResult<string>> {
    const gemini = this.getGeminiClient();
    if (!gemini) {
      return {
        success: false,
        provider: 'gemini',
        modelUsed: this.geminiModel,
        error: 'Gemini API key is required for image and vision OCR processing.',
        errorKind: 'NO_KEY',
        fixHint: 'Set GEMINI_API_KEY in your environment to process handwritten notes and images.'
      };
    }

    try {
      const response = await gemini.models.generateContent({
        model: this.geminiModel,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64
                }
              },
              { text: prompt }
            ]
          }
        ]
      });

      return {
        success: true,
        data: response.text?.trim() || '',
        provider: 'gemini',
        modelUsed: this.geminiModel
      };
    } catch (err: any) {
      const classified = this.classifyError(err);
      return {
        success: false,
        provider: 'gemini',
        modelUsed: this.geminiModel,
        error: classified.message,
        errorKind: classified.errorKind,
        fixHint: classified.fixHint
      };
    }
  }

  // Audio transcription (Groq Whisper primary)
  public async transcribe(
    audioBuffer: Buffer,
    mimeType: string,
    languageHint: string = 'en'
  ): Promise<AIProviderResult<string>> {
    if (this.groqKey) {
      try {
        const formData = new FormData();
        const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
        formData.append('file', blob, 'recording.webm');
        formData.append('model', this.groqSttModel);
        if (languageHint && languageHint !== 'hinglish') {
          formData.append('language', languageHint);
        }

        const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.groqKey}`
          },
          body: formData
        });

        if (res.ok) {
          const json = await res.json();
          return {
            success: true,
            data: json.text || '',
            provider: 'groq',
            modelUsed: this.groqSttModel
          };
        }
      } catch (err) {
        console.warn('Groq STT failed, falling back:', err);
      }
    }

    return {
      success: false,
      provider: 'groq',
      modelUsed: this.groqSttModel,
      error: 'Speech-to-text service unavailable. Use text fallback to answer.',
      errorKind: 'NO_KEY',
      fixHint: 'Configure GROQ_API_KEY with whisper-large-v3-turbo, or use the interactive keyboard input.'
    };
  }

  // Embed text
  public async embed(text: string): Promise<AIProviderResult<number[]>> {
    const cleanText = (text || '').trim();
    if (!cleanText) {
      return {
        success: false,
        provider: 'fallback_keyword',
        modelUsed: 'keyword-frequency',
        error: 'Empty text provided for embedding.'
      };
    }

    const gemini = this.getGeminiClient();
    if (gemini) {
      const candidateModels = Array.from(new Set([
        this.geminiEmbeddingModel,
        'gemini-embedding-2-preview',
        'gemini-embedding-001'
      ])).filter(Boolean);

      for (const model of candidateModels) {
        try {
          const res: any = await gemini.models.embedContent({
            model,
            contents: cleanText
          });
          const values = res.embedding?.values || res.embeddings?.[0]?.values;
          if (Array.isArray(values) && values.length > 0) {
            return {
              success: true,
              data: values,
              provider: 'gemini',
              modelUsed: model
            };
          }
        } catch (err: any) {
          // Log informative debug message and continue cascade
          console.warn(`Gemini embedding with model ${model} failed (${err?.message || err}), trying fallback`);
        }
      }
      console.warn('Gemini embedding failed, using keyword fallback');
    }

    return {
      success: false,
      provider: 'fallback_keyword',
      modelUsed: 'keyword-frequency',
      error: 'Vector embedding unavailable; falling back to hybrid BM25/keyword retrieval.'
    };
  }

  private async callGroqChat(messages: ChatMessageParam[], systemInstruction?: string): Promise<string> {
    const formattedMessages: any[] = [];
    if (systemInstruction) {
      formattedMessages.push({ role: 'system', content: systemInstruction });
    }
    for (const m of messages) {
      formattedMessages.push({ role: m.role, content: m.content });
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.groqKey}`
      },
      body: JSON.stringify({
        model: this.groqModel,
        messages: formattedMessages,
        temperature: 0.3
      })
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      throw new Error(`Groq HTTP ${res.status}: ${errBody}`);
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || '';
  }
}

export const aiProvider = new MultiAIProvider();
