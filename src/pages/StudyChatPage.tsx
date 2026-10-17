import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { useLanguage } from '../context/LanguageContext.js';
import {
  Upload, FileText, Trash2, Send, Sparkles, BookOpen, ExternalLink,
  Copy, Check, RefreshCw, MessageSquare, AlertCircle, FileCheck
} from 'lucide-react';
import { DocumentItem, ChatMessage, SourceCitation } from '../types.js';
import { ErrorBanner } from '../components/ErrorBanner.js';

interface StudyChatPageProps {
  onStartQuizWithDoc?: (docId: string) => void;
}

export const StudyChatPage: React.FC<StudyChatPageProps> = ({ onStartQuizWithDoc }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sources, setSources] = useState<SourceCitation[]>([]);
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [errorNotice, setErrorNotice] = useState<any>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
        if (data.documents?.length > 0 && !selectedDocId) {
          setSelectedDocId(data.documents[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const fetchChatHistory = async (docId?: string) => {
    try {
      const url = docId ? `/api/chat/history?documentId=${docId}` : '/api/chat/history';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchChatHistory();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorNotice({
        message: 'File size exceeds 25MB limit.',
        fixHint: 'Please compress the PDF or select a smaller chapter document.'
      });
      return;
    }

    try {
      setIsUploading(true);
      setErrorNotice(null);
      setUploadProgress(20);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.pdf$/i, ''));

      // Progress simulation
      const interval = setInterval(() => {
        setUploadProgress(prev => (prev < 80 ? prev + 15 : prev));
      }, 300);

      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (res.ok) {
        const data = await res.json();
        await fetchDocuments();
        if (data.document?.id) {
          setSelectedDocId(data.document.id);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorNotice({
          message: errJson.error || 'Failed to upload document',
          errorKind: errJson.errorKind,
          fixHint: 'Make sure it is a valid PDF (%PDF-) format.'
        });
      }
    } catch (err: any) {
      setErrorNotice({
        message: 'Upload failed due to connection error.',
        fixHint: 'Verify your network and try again.'
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this document from disk and database?')) return;

    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId));
        if (selectedDocId === docId) {
          setSelectedDocId(null);
        }
      }
    } catch (err) {
      console.error('Delete document failed:', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setInputText('');
    setIsSending(true);
    setErrorNotice(null);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          documentId: selectedDocId,
          language
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          citations: JSON.stringify(data.citations || []),
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMsg]);
        if (data.sources) {
          setSources(data.sources);
        }
      } else {
        const errJson = await res.json().catch(() => ({}));
        setErrorNotice({
          message: errJson.error || 'Failed to retrieve answer from AI',
          errorKind: errJson.errorKind,
          fixHint: errJson.fixHint || 'Try phrasing your question with specific chapter keywords.'
        });
      }
    } catch (err: any) {
      setErrorNotice({
        message: 'Could not connect to Chat AI service',
        fixHint: 'Check server connection and retry.'
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const clearChatHistory = async () => {
    try {
      await fetch('/api/chat/history', { method: 'DELETE' });
      setMessages([]);
      setSources([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {t('navStudyChat')} (PDF RAG)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload course slides, syllabus, or textbooks. Chat with exact page citations and out-of-scope guards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? `Uploading ${uploadProgress}%...` : t('uploadPdf')}</span>
          </button>
        </div>
      </div>

      <ErrorBanner
        message={errorNotice?.message}
        errorKind={errorNotice?.errorKind}
        fixHint={errorNotice?.fixHint}
        onDismiss={() => setErrorNotice(null)}
      />

      {/* Main Grid: Document List on Left (4 cols), Chat & Sources on Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Documents List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Uploaded Materials ({documents.length})
              </span>
              <button
                onClick={() => setSelectedDocId(null)}
                className={`text-[11px] font-semibold cursor-pointer ${
                  selectedDocId === null ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Search All
              </button>
            </div>

            {documents.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">{t('dropPdfHere')}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {documents.map((doc, idx) => {
                  const isSelected = selectedDocId === doc.id;
                  const isRecent = idx === 0;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 shadow-xs'
                          : 'bg-white dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                              {doc.title}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                              <span>{doc.page_count} pages</span>
                              <span>·</span>
                              <span>{doc.chunk_count} chunks</span>
                              {isRecent && (
                                <>
                                  <span>·</span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                    NEW
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={e => handleDeleteDocument(doc.id, e)}
                          title="Delete document and remove file from disk"
                          className="p-1 rounded text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/40">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100/70 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                          {t('askThisDoc')}
                        </span>
                        {onStartQuizWithDoc && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartQuizWithDoc(doc.id);
                            }}
                            className="text-[10px] px-2 py-0.5 rounded bg-amber-100/70 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold hover:bg-amber-200 transition-colors"
                          >
                            {t('quizThisDoc')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cited Sources Panel */}
          {sources.length > 0 && (
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>Verified Sources Cited</span>
              </div>
              <div className="space-y-2">
                {sources.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] space-y-1">
                    <div className="font-semibold text-indigo-600 dark:text-indigo-400 flex items-center justify-between">
                      <span className="truncate max-w-[180px]">{s.documentTitle}</span>
                      <span>Page {s.pageNumber}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 italic line-clamp-3">
                      "{s.excerpt}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Chat Stream & Input (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[650px] rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Chat Stream Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {selectedDocId
                  ? `Focusing: ${documents.find(d => d.id === selectedDocId)?.title || 'Selected Document'}`
                  : 'Searching across all uploaded semester notes'}
              </span>
            </div>

            {messages.length > 0 && (
              <button
                onClick={clearChatHistory}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                Clear Chat
              </button>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 flex items-center justify-center text-xl">
                  💡
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Ask anything from your uploaded study materials
                </h3>
                <p className="text-xs text-slate-500 max-w-md">
                  CampusSathi scans exact textbook chunks, cites pages inline, and alerts you if a question is out of syllabus.
                </p>

                {/* Example Questions */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {[
                    'What are the 4 conditions for Deadlock?',
                    'Explain difference between BFS and DFS',
                    'How does virtual memory paging work?'
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors cursor-pointer text-left"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-1 shadow-xs">
                        AI
                      </div>
                    )}

                    <div
                      className={`relative group max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700/70 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/50 dark:border-slate-700'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>

                      {!isUser && (
                        <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-600/60 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-blue-500" />
                            <span>Verified RAG Answer</span>
                          </span>

                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="Copy response"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {isSending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  AI
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-700/70 border border-slate-200/50 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Scanning textbook chunks & citing pages...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={
                  selectedDocId
                    ? "Ask a question about this chapter (e.g. formula, algorithm, definition)..."
                    : "Search or ask across all your semester notes..."
                }
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
