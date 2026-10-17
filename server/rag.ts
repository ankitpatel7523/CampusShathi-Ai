import { db } from './db.js';
import { aiProvider } from './providers.js';

export interface RetrievedChunk {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  content: string;
  score: number;
}

// Out-of-scope standard messages
export const OUT_OF_SCOPE_RESPONSES = {
  en: "Your uploaded material does not provide this answer.",
  hi: "आपके अपलोड किए गए अध्ययन सामग्री में इसका उत्तर उपलब्ध नहीं है।",
  hinglish: "Aapke uploaded study material mein iska answer provide nahi kiya gaya hai."
};

// Calculate cosine similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Tokenize text safely for keyword relevance
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

export class RAGService {
  // Check if query is out of scope before or after retrieval
  public static isOutOfScope(query: string, retrievedChunks: RetrievedChunk[]): boolean {
    if (!retrievedChunks || retrievedChunks.length === 0) {
      return true;
    }

    // Best chunk score threshold
    const topScore = retrievedChunks[0].score;
    if (topScore < 0.18) {
      return true;
    }

    // Keyword overlap check
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return true;

    let hasAnySignificantMatch = false;
    for (const chunk of retrievedChunks) {
      const chunkTokens = new Set(tokenize(chunk.content));
      const matchCount = queryTokens.filter(t => chunkTokens.has(t)).length;
      if (matchCount / queryTokens.length >= 0.25 || matchCount >= 2) {
        hasAnySignificantMatch = true;
        break;
      }
    }

    return !hasAnySignificantMatch;
  }

  // Retrieve relevant chunks for user query across their documents
  public static async retrieve(
    userId: string,
    query: string,
    documentId?: string,
    limit: number = 4
  ): Promise<RetrievedChunk[]> {
    // 1. Fetch chunks belonging to this user
    let sql = `
      SELECT c.id, c.document_id, c.page_number, c.content, c.embedding, d.title as document_title
      FROM chunks c
      JOIN documents d ON c.document_id = d.id
      WHERE c.user_id = ?
    `;
    const params: any[] = [userId];

    if (documentId) {
      sql += ` AND c.document_id = ?`;
      params.push(documentId);
    }

    const rows = db.prepare(sql).all(...params) as Array<{
      id: string;
      document_id: string;
      page_number: number;
      content: string;
      embedding: string | null;
      document_title: string;
    }>;

    if (!rows || rows.length === 0) {
      return [];
    }

    // 2. Generate embedding for query
    const queryEmbedResult = await aiProvider.embed(query);
    const queryVector = queryEmbedResult.success ? queryEmbedResult.data : null;
    const queryTokens = tokenize(query);

    const scored: RetrievedChunk[] = rows.map(row => {
      let vectorScore = 0;
      if (queryVector && row.embedding) {
        try {
          const chunkVector = JSON.parse(row.embedding);
          vectorScore = cosineSimilarity(queryVector, chunkVector);
        } catch {
          vectorScore = 0;
        }
      }

      // Keyword BM25-like scoring
      const chunkTokens = tokenize(row.content);
      const chunkTokenSet = new Set(chunkTokens);
      let keywordMatches = 0;
      for (const token of queryTokens) {
        if (chunkTokenSet.has(token)) {
          keywordMatches++;
        }
      }
      const keywordScore = queryTokens.length > 0 ? keywordMatches / queryTokens.length : 0;

      // Hybrid combined score
      const finalScore = queryVector ? vectorScore * 0.7 + keywordScore * 0.3 : keywordScore;

      return {
        documentId: row.document_id,
        documentTitle: row.document_title,
        pageNumber: row.page_number,
        content: row.content,
        score: finalScore
      };
    });

    // Sort by score descending and return top K
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }
}
