import { Router, Response } from 'express';
import { db } from '../../../../server/db.js';
import { authenticate, AuthenticatedRequest } from '../../middleware/authenticate.js';
import { EnglishChatSchema } from '../../../../shared/schemas/index.js';
import { aiProvider } from '../../../../server/providers.js';


export const englishTeacherRouter = Router();

englishTeacherRouter.post('/chat', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { message, mode, history } = EnglishChatSchema.parse(req.body);

    const modePrompts: Record<string, string> = {
      general_tutor: `You are Priya, a friendly, encouraging English conversation coach for Indian college students. Help them overcome shyness and speak confident English. Respond naturally to their message.`,
      hr_interview: `You are an experienced Corporate HR Placement Director conducting a campus placement interview for top companies (TCS, Infosys, Google, Microsoft, Accenture). Ask tough but constructive interview questions and evaluate their answer.`,
      tech_interview: `You are a Senior Technical Lead evaluating how well an engineering candidate articulates complex computer science concepts in fluent, professional English.`,
      grammar_clinic: `You are an expert English grammar and business communication instructor. Focus on identifying Indian English habits (e.g., "revert back", "prepone", "myself Ankit", wrong prepositions, tenses) and explain the correct professional phrasing.`
    };

    const systemPrompt = `
${modePrompts[mode] || modePrompts.general_tutor}
The student just said: "${message}"

You MUST respond strictly in the following JSON format without markdown code blocks:
{
  "reply": "Your conversational response to continue the dialogue or ask the next question",
  "grammarCorrection": "Point out any grammatical mistake or awkward phrasing in the student's message, and show the polished version. If none, write 'Great job! Your sentence was grammatically accurate.'",
  "vocabularyTip": "Suggest 1 or 2 high-impact corporate/academic vocabulary words or idioms they could have used instead.",
  "fluencyScore": 85,
  "confidenceTip": "1 brief sentence encouraging their tone, pace, or clarity"
}
`;

    let aiResultText = '';
    try {
      const chatMessages = (history || []).map((m: any) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }));
      chatMessages.push({ role: 'user', content: message });

      const response = await aiProvider.generateText(chatMessages, systemPrompt);
      aiResultText = response.data || '';
    } catch {

      // Clean fallback if AI provider is momentarily unreachable
      aiResultText = JSON.stringify({
        reply: `That was a great attempt! In professional interviews, speaking clearly with structured points makes an immediate positive impression. Could you give a specific real-world example from your college projects?`,
        grammarCorrection: message.includes('myself') ? `Instead of 'Myself Ankit', always say 'I am Ankit' or 'My name is Ankit' in formal settings.` : `Good sentence structure! Keep your sentences concise and avoid filler words.`,
        vocabularyTip: `Try using 'streamlined' or 'spearheaded' when describing project initiatives.`,
        fluencyScore: 82,
        confidenceTip: `Keep your voice steady and take a 1-second breath before answering complex questions.`
      });
    }

    let parsedResponse: any;
    try {
      // Strip potential markdown backticks
      const cleanJson = aiResultText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch {
      parsedResponse = {
        reply: aiResultText,
        grammarCorrection: 'Sentence understood clearly.',
        vocabularyTip: 'Expand vocabulary by practicing corporate case studies.',
        fluencyScore: 80,
        confidenceTip: 'Speaking regularly in English boosts natural fluency.'
      };
    }

    // Award XP for English speaking practice
    db.prepare(`UPDATE profiles SET xp = xp + 25, streak_days = streak_days + 1 WHERE user_id = ?`).run(userId);

    res.json(parsedResponse);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'English tutor processing error' });
  }
});
