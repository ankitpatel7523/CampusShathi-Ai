import dotenv from 'dotenv';
dotenv.config();

// Centralized Server API Credentials & Environment Configuration
// All sensitive keys are loaded securely from process.env (.env is git-ignored)
export const API_CONFIG = {
  // 1. Google Gemini AI API Key
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',

  // 2. Groq AI API Key (Qwen & Whisper audio transcription)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',

  // 3. AI Model Configurations
  AI_MODELS: {
    GEMINI_PRIMARY: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    GEMINI_EMBEDDING: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2-preview',
    GROQ_PRIMARY: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
    GROQ_STT: process.env.GROQ_STT_MODEL || 'whisper-large-v3-turbo',
  },

  // 4. Cloudinary Image Storage Credentials
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
    API_KEY: process.env.CLOUDINARY_API_KEY || '',
    API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  },

  // 5. MongoDB Atlas Connection URI
  MONGODB_URI: process.env.MONGODB_URI || '',

  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};
