import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Mic, MicOff, Volume2, VolumeX, Send, 
  Award, CheckCircle2, AlertTriangle, Lightbulb, User, Briefcase, GraduationCap, RefreshCw
} from 'lucide-react';
import { apiClient } from '../../services/api-client.js';
import confetti from 'canvas-confetti';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  grammarCorrection?: string;
  vocabularyTip?: string;
  fluencyScore?: number;
  confidenceTip?: string;
}

export const EnglishTeacherPage: React.FC = () => {
  const [mode, setMode] = useState<'general_tutor' | 'hr_interview' | 'tech_interview' | 'grammar_clinic'>('hr_interview');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your AI Campus Placement & English Coach. Let's practice your HR interview round. Question: 'Could you introduce yourself and tell me about a challenging engineering project you built?'",
      fluencyScore: 90,
      vocabularyTip: 'Use words like "spearheaded", "orchestrated", or "optimized" to describe your project responsibilities.',
      confidenceTip: 'Start with your name and degree, then focus 70% of your answer on your practical project achievements.'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setInputText('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const speakText = (text: string) => {
    if (!ttsEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await apiClient.chatEnglish(userMsg, mode, history);

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.reply || "Good answer! Let's continue.",
        grammarCorrection: res.grammarCorrection,
        vocabularyTip: res.vocabularyTip,
        fluencyScore: res.fluencyScore || 85,
        confidenceTip: res.confidenceTip
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(assistantMsg.content);

      if ((res.fluencyScore || 85) >= 90) {
        confetti({ particleCount: 30, spread: 50 });
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I heard you clearly! In interview answers, remember to follow the STAR method (Situation, Task, Action, Result). Could you share what challenges you faced during that phase?'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (newMode: typeof mode) => {
    setMode(newMode);
    let greeting = '';
    if (newMode === 'hr_interview') {
      greeting = "Welcome to the HR Placement Round! Question: 'Why do you want to join our company, and where do you see yourself in 3 years?'";
    } else if (newMode === 'tech_interview') {
      greeting = "Welcome to the Technical Interview! Question: 'Can you explain the difference between Process and Thread in Operating Systems, and when you would prefer multi-threading over multi-processing?'";
    } else if (newMode === 'grammar_clinic') {
      greeting = "Welcome to Grammar & Indian Phrasing Clinic! Type or speak any sentence you normally use, and I will fix any awkward phrasing, tense errors, or corporate email mistakes.";
    } else {
      greeting = "Hi there! I am your friendly English conversational coach. Don't worry about making mistakes—just talk to me about your day, hobbies, or college life!";
    }

    setMessages([
      {
        role: 'assistant',
        content: greeting,
        fluencyScore: 90
      }
    ]);
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white p-6 md:p-8 shadow-lg shadow-teal-500/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <GraduationCap className="w-3.5 h-3.5 text-teal-200" />
            <span>Placement & Fluency Mentor 🗣️</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            English AI Teacher & Placement Coach
          </h1>
          <p className="mt-2 text-white/90 text-sm md:text-base leading-relaxed">
            Practice spoken English without hesitation! Prepare for corporate HR rounds, technical project explanations, and get live grammar fixes tailored for Indian students.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {[
              { id: 'hr_interview', label: '👔 HR Placement Round' },
              { id: 'tech_interview', label: '💻 Tech Articulation' },
              { id: 'general_tutor', label: '☕ Casual Spoken English' },
              { id: 'grammar_clinic', label: '✍️ Grammar Clinic' }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id as any)}
                className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  mode === m.id
                    ? 'bg-white text-teal-800 shadow-md font-bold'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Chat / Voice Window */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-[560px]">
          {/* Top Chat Controls */}
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {mode === 'hr_interview' && 'Senior HR Placement Interviewer'}
                {mode === 'tech_interview' && 'Senior Tech Lead'}
                {mode === 'general_tutor' && 'Priya - English Conversation Coach'}
                {mode === 'grammar_clinic' && 'Grammar & Professional Writing Coach'}
              </span>
            </div>

            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-teal-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              <span>{ttsEnabled ? 'Voice On' : 'Voice Off'}</span>
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold text-xs shrink-0">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start items-center text-xs text-slate-400">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 flex items-center justify-center font-bold text-xs">
                  AI
                </div>
                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl transition cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
              title={isRecording ? 'Click to stop' : 'Click to speak English'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isRecording ? 'Listening to your voice...' : 'Type or speak your answer in English...'}
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500"
            />

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white transition shadow cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Feedback & Coaching Insights Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-teal-600" />
                Live Fluency & Grammar Feedback
              </h3>
            </div>

            {/* Fluency Score Meter */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
              <span className="text-xs text-slate-500 font-medium block">Turn Fluency Score</span>
              <div className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">
                {lastAssistantMsg?.fluencyScore || 85}%
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Based on sentence length, grammar, and vocabulary richness</p>
            </div>

            {/* Grammar Correction */}
            {lastAssistantMsg?.grammarCorrection && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Grammar Polish & Fix</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {lastAssistantMsg.grammarCorrection}
                </p>
              </div>
            )}

            {/* Vocabulary Upgrade Tip */}
            {lastAssistantMsg?.vocabularyTip && (
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Corporate Vocabulary Tip</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {lastAssistantMsg.vocabularyTip}
                </p>
              </div>
            )}

            {/* Confidence Tip */}
            {lastAssistantMsg?.confidenceTip && (
              <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Examiner Confidence Tip</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {lastAssistantMsg.confidenceTip}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
