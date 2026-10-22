import dotenv from 'dotenv';
dotenv.config();

export const API_CONFIG = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  AI_MODELS: {
    GEMINI_PRIMARY: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    GEMINI_EMBEDDING: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
    GROQ_PRIMARY: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    GROQ_STT: process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo',
  },
  PORT: Number(process.env.PORT ?? 3000),
  NODE_ENV: process.env.NODE_ENV || 'development',
};
