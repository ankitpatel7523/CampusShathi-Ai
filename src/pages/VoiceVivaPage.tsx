import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Mic, MicOff, Volume2, Sparkles, Trophy, Award, CheckCircle2,
  AlertCircle, ArrowRight, RotateCcw, Download, MessageSquare, Play, Square
} from 'lucide-react';
import { VivaTurn } from '../types.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

export const VoiceVivaPage: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const { language, t } = useLanguage();

  const [topic, setTopic] = useState('Operating Systems Core & Synchronization');
  const [mode, setMode] = useState<'college_viva' | 'placement_interview'>('college_viva');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [turns, setTurns] = useState<VivaTurn[]>([]);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [finalReport, setFinalReport] = useState<any>(null);

  // Audio & speech state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorNotice, setErrorNotice] = useState<any>(null);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Web Speech API for TTS reading of questions
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (language === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';

    utterance.onstart = () => setIsSpeakingQuestion(true);
    utterance.onend = () => setIsSpeakingQuestion(false);
    utterance.onerror = () => setIsSpeakingQuestion(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStartViva = async () => {
    try {
      setIsEvaluating(true);
      setErrorNotice(null);
      setTurns([]);
      setIsComplete(false);
      setFinalReport(null);

      const res = await fetch('/api/viva/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mode, difficulty, language })
      });

      const data = await res.json();
      if (res.ok && data.sessionId) {
        setSessionId(data.sessionId);
        setCurrentQuestion(data.question);
        setTurnNumber(1);
        setIsSessionActive(true);
        // Automatically speak question with TTS
        setTimeout(() => speakText(data.question), 300);
      } else {
        setErrorNotice({
          message: data.error || 'Failed to start viva session',
          errorKind: data.errorKind,
          fixHint: data.fixHint || 'Try selecting a different topic.'
        });
      }
    } catch (err: any) {
      setErrorNotice({
        message: 'Could not connect to Viva service',
        fixHint: 'Check network and retry.'
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  // Push-to-talk microphone recording
  const startRecording = async () => {
    setErrorNotice(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setErrorNotice({
        message: 'Microphone access denied or not available.',
        fixHint: 'Allow microphone permissions in your browser, or type your answer in the box below.'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!sessionId || isEvaluating) return;
    if (!audioBlob && !typedAnswer.trim()) {
      setErrorNotice({
        message: 'Please provide an answer by speaking or typing.',
        fixHint: 'Hold the microphone button or type in the response text box.'
      });
      return;
    }

    try {
      setIsEvaluating(true);
      setErrorNotice(null);

      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('turnNumber', String(turnNumber));
      formData.append('currentQuestion', currentQuestion);
      formData.append('typedAnswer', typedAnswer.trim());
      formData.append('language', language);
      if (audioBlob) {
        formData.append('audio', audioBlob, 'answer.webm');
      }

      const res = await fetch('/api/viva/answer', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        const currentTurnResult: VivaTurn = {
          turnNumber,
          question: currentQuestion,
          studentAnswer: data.studentTranscript,
          score: data.score,
          feedback: data.feedback,
          missingPoints: data.missingPoints,
          modelAnswer: data.modelAnswer
        };

        setTurns(prev => [...prev, currentTurnResult]);
        setTypedAnswer('');
        setAudioBlob(null);

        if (data.isComplete || turnNumber >= 5) {
          handleFinishSession(sessionId);
        } else if (data.nextQuestion) {
          setCurrentQuestion(data.nextQuestion);
          setTurnNumber(prev => prev + 1);
          setTimeout(() => speakText(data.nextQuestion), 300);
        }
      } else {
        setErrorNotice({
          message: data.error || 'Failed to evaluate answer',
          fixHint: 'Try clarifying your answer and resubmit.'
        });
      }
    } catch (err: any) {
      setErrorNotice({
        message: 'Evaluation failed due to network error.',
        fixHint: 'Check server connection and retry.'
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleFinishSession = async (sessId: string) => {
    try {
      const res = await fetch('/api/viva/finish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessId })
      });
      if (res.ok) {
        const data = await res.json();
        setFinalReport(data.report);
        setIsComplete(true);
        refreshUserData();
      }
    } catch (err) {
      console.error('Failed to finish viva:', err);
    }
  };

  const downloadReport = () => {
    if (!finalReport) return;
    const reportText = `CampusSathi AI - Voice Viva Evaluation Report
Topic: ${topic}
Mode: ${mode === 'college_viva' ? 'College Academic Viva' : 'Placement Technical Interview'}
Overall Score: ${finalReport.overallScore}/10
Strengths: ${finalReport.strengths}
Weaknesses: ${finalReport.weaknesses}
Speaking Pace: ${finalReport.paceFeedback}

--- Questions & Answers ---
${turns.map(t => `Q${t.turnNumber}: ${t.question}
Your Answer: ${t.studentAnswer}
Score: ${t.score}/10
Feedback: ${t.feedback}
Model Answer: ${t.modelAnswer}
`).join('\n------------------------\n')}
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Viva_Report_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-pink-400">
              <Mic className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {t('navViva')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real spoken viva & placement technical rounds. Spoken audio questions, microphone recording, Whisper transcription, and faculty grading.
          </p>
        </div>
      </div>

      <ErrorBanner
        message={errorNotice?.message}
        errorKind={errorNotice?.errorKind}
        fixHint={errorNotice?.fixHint}
        onDismiss={() => setErrorNotice(null)}
      />

      {/* Step 1: Configurator (when no active viva) */}
      {!isSessionActive && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Prepare for Spoken Oral Assessment
            </h2>
            <p className="text-xs text-slate-500">
              Practice answering on spot without notes to overcome stage fright and placement nervousness.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mode selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Viva Assessment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'college_viva', label: 'College Viva' },
                  { id: 'placement_interview', label: 'Tech Placement' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id as any)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      mode === m.id
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-pink-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl as any)}
                    className={`py-2 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                      difficulty === lvl
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-400 text-rose-700 dark:text-pink-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Input */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subject & Syllabus Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Operating Systems Process Synchronization, Graph Algorithms"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <button
            onClick={handleStartViva}
            disabled={isEvaluating}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold text-sm shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Mic className="w-4 h-4" />
            <span>{isEvaluating ? 'Connecting Examiner...' : 'Enter Viva Examination Room'}</span>
          </button>
        </div>
      )}

      {/* Step 2: Active Viva Question & Voice Input Room */}
      {isSessionActive && !isComplete && (
        <div className="space-y-6">
          {/* Question Stage Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
              <span className="text-xs font-bold text-rose-600 dark:text-pink-400 uppercase tracking-wider">
                Question {turnNumber} of 5
              </span>
              <button
                onClick={() => speakText(currentQuestion)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Volume2 className={`w-4 h-4 ${isSpeakingQuestion ? 'text-rose-600 animate-bounce' : ''}`} />
                <span>Repeat Audio</span>
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40">
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                "{currentQuestion}"
              </p>
            </div>

            {/* Speaking / Audio Recorder Deck */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4">
              <button
                type="button"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform cursor-pointer select-none ${
                  isRecording
                    ? 'bg-red-600 text-white scale-110 shadow-red-500/50 animate-pulse'
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                }`}
              >
                {isRecording ? <Square className="w-8 h-8 fill-white" /> : <Mic className="w-8 h-8" />}
              </button>

              <div className="text-center">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isRecording ? 'Listening... Release button to finish' : 'Press & Hold to Speak (Microphone)'}
                </div>
                {audioBlob && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    ✓ Audio answer recorded and ready for Whisper transcription
                  </p>
                )}
              </div>
            </div>

            {/* Fallback Text Input (if mic blocked) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>Or Type Your Answer (Microphone Fallback)</span>
                {typedAnswer && <span className="text-emerald-600 font-normal">Ready</span>}
              </label>
              <textarea
                rows={3}
                value={typedAnswer}
                onChange={e => setTypedAnswer(e.target.value)}
                placeholder="Type your explanation here if microphone is muted or in noisy surroundings..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              onClick={handleSubmitAnswer}
              disabled={isEvaluating || (!audioBlob && !typedAnswer.trim())}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              <span>{isEvaluating ? 'Transcribing & Grading Answer...' : 'Submit Answer for Faculty Grading'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Previous Evaluated Turns Feed */}
          {turns.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Graded Questions so far
              </h3>
              {turns.map((turn, idx) => (
                <div key={idx} className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-500">Turn #{turn.turnNumber}</span>
                    <span className="text-xs font-bold text-rose-600 dark:text-pink-400 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950">
                      Score: {turn.score}/10
                    </span>
                  </div>

                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Q: {turn.question}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">
                      Your Answer: "{turn.studentAnswer}"
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">Feedback</span>
                      <p className="text-slate-700 dark:text-slate-300">{turn.feedback}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">Ideal Model Answer</span>
                      <p className="text-slate-700 dark:text-slate-300">{turn.modelAnswer}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Viva Final Report Card */}
      {isComplete && finalReport && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center mx-auto text-2xl shadow-lg shadow-rose-500/20">
              <Trophy className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Viva Examination Report
            </h2>
            <p className="text-sm text-slate-500">
              Oral assessment completed across 5 technical questions.
            </p>
            <div className="text-3xl font-extrabold text-rose-600 dark:text-pink-400 tabular-nums">
              {finalReport.overallScore} <span className="text-sm font-normal text-slate-500">/ 10</span>
            </div>
          </div>

          {/* Qualitative Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 text-xs space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">Identified Strengths</span>
              <p className="text-emerald-900/90 dark:text-emerald-200">{finalReport.strengths}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 text-xs space-y-1">
              <span className="font-bold text-amber-800 dark:text-amber-300 block">Areas for Revision</span>
              <p className="text-amber-900/90 dark:text-amber-200">{finalReport.weaknesses}</p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/60 text-xs space-y-1">
              <span className="font-bold text-indigo-800 dark:text-indigo-300 block">Pace & Speaking Flow</span>
              <p className="text-indigo-900/90 dark:text-indigo-200">{finalReport.paceFeedback}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <button
              onClick={downloadReport}
              className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Report Summary (.txt)</span>
            </button>
            <button
              onClick={() => {
                setIsSessionActive(false);
                setIsComplete(false);
                setTurns([]);
              }}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Practice Another Viva</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
