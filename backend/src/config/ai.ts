import { aiProvider } from '../../../server/providers.js';
import { ENV } from './env.js';

export { aiProvider };

export const AI_CONFIG = {
  geminiModel: ENV.GEMINI_MODEL,
  groqModel: ENV.GROQ_MODEL,
  hasGeminiKey: Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.length > 5),
  hasGroqKey: Boolean(ENV.GROQ_API_KEY && ENV.GROQ_API_KEY.length > 5)
};
